/**
 * SendGrid Email Delivery Module
 * Uses native fetch to SendGrid v3 API for zero-cold-start serverless compatibility.
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const rawApiKey = process.env.SENDGRID_API_KEY || '';
  const apiKey = rawApiKey.replace(/["'\r\n\t]/g, '').trim();
  const fromEmail = (payload.from || process.env.SENDGRID_FROM_EMAIL || 'support@trendly.ai').replace(/["'\r\n\t]/g, '').trim();
  const fromName = payload.fromName || process.env.SENDGRID_FROM_NAME || 'Trendly Autonomous Wealth';

  if (!apiKey) {
    console.warn('[SENDGRID] SENDGRID_API_KEY is not set. Email delivery skipped in dev mode.');
    return {
      success: true,
      messageId: `dev-mock-${Date.now()}`,
    };
  }

  if (!apiKey.startsWith('SG.')) {
    return {
      success: false,
      error: `Invalid API key format. SendGrid API keys must start with 'SG.'. Found key starting with '${apiKey.substring(0, 4)}...' (Length: ${apiKey.length})`,
    };
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: payload.to }],
          },
        ],
        from: {
          email: fromEmail,
          name: fromName,
        },
        subject: payload.subject,
        content: [
          {
            type: 'text/html',
            value: payload.html,
          },
          ...(payload.text ? [{ type: 'text/plain', value: payload.text }] : []),
        ],
      }),
    });

    if (response.status >= 200 && response.status < 300) {
      const messageId = response.headers.get('x-message-id') || `sg-${Date.now()}`;
      return { success: true, messageId };
    } else {
      const errorBody = await response.text();
      console.error(`[SENDGRID] Error ${response.status}:`, errorBody);
      return { success: false, error: `SendGrid returned ${response.status}: ${errorBody}` };
    }
  } catch (error: any) {
    console.error('[SENDGRID] Network error sending email:', error);
    return { success: false, error: error?.message || 'Network error' };
  }
}

/**
 * Sends a high-priority agent execution briefing to the operative
 */
export async function sendAgentBriefingEmail(
  toEmail: string,
  agentName: string,
  summary: string,
  runId: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://trendly-platform-chi.vercel.app';
  const terminalUrl = `${baseUrl}/agents/${runId}/status`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #07070C; color: #FFFFFF; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #0B0B14; border: 1px solid #1E2235; border-radius: 12px; padding: 32px; }
        .badge { display: inline-block; background-color: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.3); color: #00F0FF; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; font-family: monospace; }
        h1 { color: #FFFFFF; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 16px; margin-bottom: 8px; }
        p { color: #8892B0; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; }
        .box { background-color: #05050A; border: 1px solid #1E2235; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px; color: #CCD6F6; }
        .btn { display: inline-block; background-color: #00F0FF; color: #000000; font-weight: 800; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
        .footer { margin-top: 24px; font-size: 11px; color: #4A5568; text-align: center; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="badge">Swarm Telemetry Briefing</div>
        <h1>Agent Execution Complete: ${agentName}</h1>
        <p>Your autonomous worker node has completed execution with 100% telemetry verified.</p>
        
        <div class="box">
          <strong style="color: #FFD700; display: block; margin-bottom: 8px;">Executive Summary:</strong>
          ${summary}
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${terminalUrl}" class="btn">View Live Telemetry & Export Assets</a>
        </div>

        <div class="footer">
          Trendly Autonomous Wealth Intelligence // Protocol Node 2.4
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: `⚡ [Briefing] ${agentName} Execution Complete`,
    html,
  });
}

/**
 * Sends password reset token email
 */
export async function sendPasswordResetEmail(toEmail: string, resetToken: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://trendly-platform-chi.vercel.app';
  const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background-color: #07070C; color: #FFFFFF; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background-color: #0B0B14; border: 1px solid #1E2235; border-radius: 12px; padding: 32px; }
        .btn { display: inline-block; background-color: #00F0FF; color: #000000; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 13px; text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2 style="color: #FFFFFF; text-transform: uppercase;">Reset Your Trendly Security Credentials</h2>
        <p style="color: #8892B0; font-size: 14px;">We received a request to reset your password. Click the button below to establish a new password:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" class="btn">Reset Password</a>
        </div>
        <p style="color: #4A5568; font-size: 12px;">If you did not request this, you can safely ignore this email.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: `🔐 Trendly Password Reset Request`,
    html,
  });
}
