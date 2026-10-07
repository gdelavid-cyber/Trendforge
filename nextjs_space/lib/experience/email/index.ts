import { sendEmail, sendPasswordResetEmail, sendAgentBriefingEmail } from './sendgrid';

export * from './sendgrid';

export async function sendNotificationEmail(params: {
  notificationId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  replyTo?: string;
}) {
  const sendgridApiKey = process.env.SENDGRID_API_KEY;

  return await sendEmail({
    to: params.recipientEmail,
    subject: params.subject,
    html: params.isHtml !== false ? params.body : `<p>${params.body}</p>`,
    text: params.body.replace(/<[^>]*>?/gm, ''),
  });
}
