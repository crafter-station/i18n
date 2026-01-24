import { Resend } from "resend";

interface SendEmailParams {
  to: string[];
  subject: string;
  body: string;
  meetingSummary?: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  mocked?: boolean;
}

export async function sendEmail({
  to,
  subject,
  body,
  meetingSummary,
}: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  // Mock mode if no API key
  if (!apiKey || apiKey === "mock" || apiKey === "re_mock") {
    console.log("[MOCK] Email would be sent:", { to, subject, body });
    return {
      success: true,
      messageId: `mock_${Date.now()}`,
      mocked: true,
    };
  }

  const resend = new Resend(apiKey);

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #000; color: #fff; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-weight: 300; font-size: 24px;">Meeting Update</h1>
      </div>

      <div style="padding: 30px; background: #f9f9f9;">
        ${
          meetingSummary
            ? `
          <div style="background: #fff; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #000;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #666;">Meeting Summary</h3>
            <p style="margin: 0; color: #333; line-height: 1.6;">${meetingSummary}</p>
          </div>
        `
            : ""
        }

        <div style="background: #fff; border-radius: 8px; padding: 20px;">
          <p style="margin: 0; color: #333; line-height: 1.6; white-space: pre-wrap;">${body}</p>
        </div>
      </div>

      <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
        <p style="margin: 0;">Sent by your Meeting AI Agent</p>
      </div>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: `i18n.meet Agent <${fromEmail}>`,
      to,
      subject,
      html: htmlBody,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
