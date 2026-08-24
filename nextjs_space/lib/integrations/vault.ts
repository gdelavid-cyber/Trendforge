import { prisma } from '@/lib/db';
import { encryptSecret, decryptSecret, maskSecret } from '@/lib/encryption';

// Bring-your-own-key action integrations. Same vault discipline as the BYOK
// LLM keys: AES-256-GCM at rest, masked reads only, decrypted values exist
// in-process for the duration of a runner call and are never logged.

export const INTEGRATION_PROVIDERS = ['sendgrid', 'resend', 'x', 'polymarket', 'websearch'] as const;
export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

export const PROVIDER_LABELS: Record<IntegrationProvider, string> = {
  sendgrid: 'SendGrid (email delivery)',
  resend: 'Resend (email delivery)',
  x: 'X / Twitter (posting)',
  polymarket: 'Polymarket (trading)',
  websearch: 'Web Search (live research)',
};

/** Fields the client must submit per provider (validated on PUT). */
export const PROVIDER_KEY_FIELDS: Record<IntegrationProvider, string[]> = {
  sendgrid: ['apiKey'],
  resend: ['apiKey'],
  x: ['accessToken'],
  polymarket: ['apiKey', 'secret', 'passphrase'],
  websearch: ['apiKey', 'vendor'],
};

export interface IntegrationCreds {
  [field: string]: unknown;
}

export interface IntegrationSummary {
  provider: IntegrationProvider;
  label: string;
  meta: Record<string, unknown> | null;
  maskedKey: string;
  connectedAt: Date;
  updatedAt: Date;
}

function validateCreds(provider: IntegrationProvider, creds: IntegrationCreds): string | null {
  for (const field of PROVIDER_KEY_FIELDS[provider]) {
    const v = creds[field];
    if (typeof v !== 'string' || !v.trim()) return `Missing required field: ${field}`;
  }
  if (provider === 'websearch') {
    const vendor = String(creds.vendor);
    if (!['serper', 'tavily', 'brave'].includes(vendor)) {
      return "websearch vendor must be 'serper' | 'tavily' | 'brave'";
    }
  }
  return null;
}

export async function saveIntegration(params: {
  userId: string;
  provider: IntegrationProvider;
  creds: IntegrationCreds;
  meta?: Record<string, unknown>;
}): Promise<IntegrationSummary> {
  const { userId, provider, creds } = params;
  const invalid = validateCreds(provider, creds);
  if (invalid) throw new Error(invalid);

  const encryptedKey = encryptSecret(JSON.stringify(creds));
  const row = await prisma.userIntegrationKey.upsert({
    where: { userId_provider: { userId, provider } },
    create: { userId, provider, encryptedKey, meta: params.meta as object ?? undefined },
    update: { encryptedKey, meta: params.meta as object ?? undefined },
  });
  return toSummary(provider, row.meta as Record<string, unknown> | null, maskSecret(firstSecret(creds)), row.createdAt, row.updatedAt);
}

export async function getIntegration(
  userId: string,
  provider: IntegrationProvider
): Promise<IntegrationCreds | null> {
  const row = await prisma.userIntegrationKey.findUnique({
    where: { userId_provider: { userId, provider } },
  });
  if (!row) return null;
  try {
    const parsed = JSON.parse(decryptSecret(row.encryptedKey));
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

export async function listIntegrations(userId: string): Promise<IntegrationSummary[]> {
  const rows = await prisma.userIntegrationKey.findMany({ where: { userId } });
  return rows.map((row) => {
    const provider = row.provider as IntegrationProvider;
    let masked = '••••';
    try {
      masked = maskSecret(firstSecret(JSON.parse(decryptSecret(row.encryptedKey)) as IntegrationCreds));
    } catch {
      // keep placeholder mask if decryption fails
    }
    return toSummary(provider, row.meta as Record<string, unknown> | null, masked, row.createdAt, row.updatedAt);
  });
}

export async function deleteIntegration(userId: string, provider: IntegrationProvider): Promise<boolean> {
  const res = await prisma.userIntegrationKey.deleteMany({ where: { userId, provider } });
  return res.count > 0;
}

function firstSecret(creds: IntegrationCreds): string {
  const firstKeyField = Object.keys(creds)[0];
  return typeof creds[firstKeyField] === 'string' ? (creds[firstKeyField] as string) : '';
}

function toSummary(
  provider: IntegrationProvider,
  meta: Record<string, unknown> | null,
  maskedKey: string,
  createdAt: Date,
  updatedAt: Date
): IntegrationSummary {
  return { provider, label: PROVIDER_LABELS[provider] ?? provider, meta, maskedKey, connectedAt: createdAt, updatedAt };
}
