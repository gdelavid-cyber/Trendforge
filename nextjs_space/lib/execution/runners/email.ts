import type { LlmFn } from '../skills';
import type { ParsedStep } from '@/lib/pipeline/steps';
import { getIntegration } from '@/lib/core/vault';
import { prisma } from '@/lib/core/db';

// Real email delivery through the user's connected SendGrid or Resend key.
// Recipient: first address found in the step text, else the account email.
// Never sends without a connected provider — callers gate on that.

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;

export async function hasEmailProvider(userId: string): Promise<'sendgrid' | 'resend' | null> {
  if (await getIntegration(userId, 'sendgrid')) return 'sendgrid';
  if (await getIntegration(userId, 'resend')) return 'resend';
  return null;
}

async function sendViaSendgrid(
  apiKey: string,
  params: { to: string; from: string; subject: string; text: string }
): Promise<{ id: string }> {
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: params.to }] }],
      from: { email: params.from },
      subject: params.subject,
      content: [{ type: 'text/plain', value: params.text }],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`SendGrid ${res.status}: ${body.slice(0, 200)}`);
  }
  return { id: res.headers.get('x-message-id') ?? 'sendgrid-accepted' };
}

async function sendViaResend(
  apiKey: string,
  params: { to: string; from: string; subject: string; text: string }
): Promise<{ id: string }> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: params.from,
      to: [params.to],
      subject: params.subject,
      text: params.text,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return { id: data.id ?? 'resend-accepted' };
}

export async function runEmailStep(params: {
  step: ParsedStep;
  userId: string;
  taskTitle: string;
  previousResults: string[];
  llm: LlmFn;
}): Promise<{ output: string; recipient: string; messageId: string; provider: 'sendgrid' | 'resend'; subject: string }> {
  const { step, userId, taskTitle, previousResults, llm } = params;

  const provider = await hasEmailProvider(userId);
  if (!provider) throw new Error('NO_EMAIL_PROVIDER');

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } });
  const recipient = step.description.match(EMAIL_RE)?.[0] ?? user.email;

  const draft = await llm([
    {
      role: 'system',
      content: `You are an email-writing assistant executing "${taskTitle}". Write the ready-to-send email for the step below. Output ONLY the email body text — no subject line, no commentary, no placeholders like [Name].`,
    },
    {
      role: 'user',
      content: `Step: ${step.title}\n${step.description}\n\n${previousResults.length ? `Context from earlier steps:\n${previousResults.map((r, i) => `${i + 1}. ${r}`).join('\n')}` : ''}`,
    },
  ]);

  const subject = step.title.slice(0, 120);
  const body = (draft || '').trim();

  const creds = (await getIntegration(userId, provider)) as { apiKey?: string } | null;
  const row = await prisma.userIntegrationKey.findUniqueOrThrow({
    where: { userId_provider: { userId, provider } },
    select: { meta: true },
  });
  const verifiedSender = (row.meta as any)?.verifiedSender ?? user.email;
  const sendParams = { to: recipient, from: verifiedSender, subject, text: body };

  const result = provider === 'sendgrid'
    ? await sendViaSendgrid(creds!.apiKey!, sendParams)
    : await sendViaResend(creds!.apiKey!, sendParams);

  return {
    output: `Email sent to ${recipient} via ${provider} (id ${result.id}).\n\nSubject: ${subject}\n\n${body}`,
    recipient,
    messageId: result.id,
    provider,
    subject,
  };
}
