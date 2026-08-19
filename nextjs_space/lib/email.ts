export async function sendNotificationEmail(params: {
  notificationId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  replyTo?: string;
}) {
  const apiKey = process.env.ABACUSAI_API_KEY;
  const appId = process.env.WEB_APP_ID;
  const baseUrl = process.env.NEXTAUTH_URL ?? '';

  if (!apiKey || !appId) {
    console.log('[EMAIL] Missing API key or app ID. Logging email to console:');
    console.log(`  To: ${params.recipientEmail}`);
    console.log(`  Subject: ${params.subject}`);
    console.log(`  Body: ${params.body?.substring(0, 200)}...`);
    return { success: true, fallback: true };
  }

  try {
    let senderHost = 'mail.abacusai.app';
    try { senderHost = new URL(baseUrl).hostname; } catch {}

    const response = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: apiKey,
        app_id: appId,
        notification_id: params.notificationId,
        subject: params.subject,
        body: params.body,
        is_html: params.isHtml ?? true,
        recipient_email: params.recipientEmail,
        sender_email: `noreply@${senderHost}`,
        sender_alias: 'Trendly',
        ...(params.replyTo ? { reply_to: params.replyTo } : {}),
      }),
    });

    const result = await response.json();
    if (!result?.success) {
      if (result?.notification_disabled) {
        console.log('[EMAIL] Notification disabled by user, skipping.');
        return { success: true, disabled: true };
      }
      console.error('[EMAIL] Send failed:', result?.message);
      return { success: false, error: result?.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('[EMAIL] Error sending:', err?.message);
    return { success: false, error: err?.message };
  }
}
