import { sendEmail, sendPasswordResetEmail, sendAgentBriefingEmail } from '@/lib/email/sendgrid';
export { sendEmail, sendPasswordResetEmail, sendAgentBriefingEmail };

export async function sendNotificationEmail(params: {
  notificationId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  replyTo?: string;
}) {
  const sendgridApiKey = process.env.SENDGRID_API_KEY;

  // Primary: Use SendGrid when SENDGRID_API_KEY is configured
  if (sendgridApiKey) {
    const result = await sendEmail({
      to: params.recipientEmail,
      subject: params.subject,
      html: params.isHtml !== false ? params.body : `<p>${params.body}</p>`,
      text: params.body.replace(/<[^>]*>?/gm, ''),
    });
    return result;
  }

  // Fallback dev console logging
  console.log('[EMAIL / SENDGRID] No SENDGRID_API_KEY set. Logging email to console:');
  console.log(`  To: ${params.recipientEmail}`);
  console.log(`  Subject: ${params.subject}`);
  console.log(`  Body: ${params.body?.substring(0, 200)}...`);
  return { success: true, fallback: true };
}
