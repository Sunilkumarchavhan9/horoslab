import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

export interface SendEarlyAccessEmailParams {
  email: string;
  name?: string;
  provider?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

// 1. In-memory / file persistent registry so NO signup is ever lost
function recordSignupToFile(record: {
  email: string;
  name?: string;
  provider: string;
  timestamp: string;
}) {
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const filePath = path.join(dataDir, "signups.json");
    let existing: any[] = [];
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, "utf8");
        existing = JSON.parse(fileContent);
      } catch {
        existing = [];
      }
    }
    // Prevent duplicate spam
    const already = existing.find((s) => s.email.toLowerCase() === record.email.toLowerCase());
    if (!already) {
      existing.unshift(record);
      fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), "utf8");
    }
  } catch (err) {
    console.warn("[HOROS Signups] Could not write to signups.json:", err);
  }
}

// 2. Real-Time Team Webhook (Slack / Discord)
async function triggerSignupWebhook(record: { email: string; name?: string; provider: string; timestamp: string }) {
  const webhookUrl = process.env.SIGNUP_ALERT_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const text = `🚀 *New HOROS Signup Registered*\n• *Email:* \`${record.email}\`\n• *Name:* ${record.name || "N/A"}\n• *Provider:* \`${record.provider}\`\n• *Time:* ${record.timestamp}`;
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        content: text, // Discord compatibility
      }),
    });
  } catch (err) {
    console.warn("[HOROS Webhook] Failed to dispatch webhook alert:", err);
  }
}

// 3. Send Professional Transactional Email
export async function sendEarlyAccessConfirmationEmail({
  email,
  name,
  provider = "email",
}: SendEarlyAccessEmailParams): Promise<SendResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const timestamp = new Date().toISOString();

  // Save record immediately
  recordSignupToFile({
    email: normalizedEmail,
    name: name || undefined,
    provider,
    timestamp,
  });

  // Trigger team webhook in background
  void triggerSignupWebhook({
    email: normalizedEmail,
    name: name || undefined,
    provider,
    timestamp,
  });

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromAddress = process.env.SMTP_FROM || '"HOROS Access Group" <access@horoslab.io>';
  const resendApiKey = process.env.RESEND_API_KEY;

  const subject = "HOROS Early Access: Registration Confirmed";
  const priorityId = `HOROS-${Date.now().toString(36).toUpperCase()}`;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>HOROS Early Access Confirmation</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0c0c0c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F0EFE2; }
    .wrapper { width: 100%; background-color: #0c0c0c; padding: 40px 12px; }
    .card { max-width: 560px; margin: 0 auto; background-color: #141414; border: 1px solid #282828; padding: 36px 32px; box-sizing: border-box; }
    .header { border-bottom: 1px solid #242424; padding-bottom: 20px; margin-bottom: 24px; }
    .logo { font-size: 15px; font-weight: 800; letter-spacing: 0.08em; color: #F0EFE2; font-family: monospace; }
    .tag { display: inline-block; padding: 2px 8px; background-color: #142206; border: 1px solid #75bf00; color: #75bf00; font-size: 10.5px; font-family: monospace; font-weight: 700; letter-spacing: 0.08em; margin-top: 8px; }
    h1 { font-size: 20px; font-weight: 700; color: #F0EFE2; letter-spacing: -0.02em; margin: 0 0 16px 0; }
    p { font-size: 13.5px; line-height: 1.65; color: #A6A598; margin: 0 0 16px 0; }
    .meta-box { background-color: #0e0e0e; border-left: 2px solid #75bf00; padding: 14px 16px; margin: 22px 0; font-family: monospace; font-size: 11.5px; color: #D6D5C9; line-height: 1.8; }
    .btn { display: inline-block; background-color: #75bf00; color: #000000 !important; font-weight: 800; font-size: 12px; padding: 12px 20px; text-decoration: none; letter-spacing: 0.02em; }
    .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #242424; font-size: 11px; color: #666660; font-family: monospace; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo">HOROS // INFRASTRUCTURE</div>
        <div class="tag">PRIORITY QUEUE &middot; ${priorityId}</div>
      </div>
      <h1>Early Access Confirmed</h1>
      <p>Hello${name ? ` ${name}` : ""},</p>
      <p>Thank you for registering your interest in HOROS. Your organization has been successfully registered in our early access queue.</p>
      <div class="meta-box">
        <strong>QUEUE STATUS:</strong> ACCESS RESERVED<br>
        <strong>REGISTERED ID:</strong> ${normalizedEmail}<br>
        <strong>METHOD:</strong> ${provider.toUpperCase()}<br>
        <strong>CLUSTER:</strong> TIER-1 EARLY COMPUTE WAVE
      </div>
      <p>We are currently ramping up initial cluster capacity and institutional agent runtimes. As soon as early access deployments open, your account will receive first notification and priority platform credentials before public availability.</p>
      <p>If your team requires an architectural briefing or custom compute provisioning before launch, you can schedule a technical session with our systems group below:</p>
      <div style="margin: 24px 0 16px 0;">
        <a href="https://cal.com/vegito" class="btn" target="_blank">SCHEDULE TECHNICAL DEMO &rarr;</a>
      </div>
      <div class="footer">
        HOROS INC. &middot; Autonomous Organization Infrastructure<br>
        Web: <a href="https://horoslab.io" style="color: #888888; text-decoration: none;">https://horoslab.io</a> &middot; Contact: <a href="mailto:contact@horoslab.io" style="color: #888888; text-decoration: none;">contact@horoslab.io</a><br>
        This priority notification was sent directly to ${normalizedEmail}.
      </div>
    </div>
  </div>
</body>
</html>`;

  const textContent = `HOROS // EARLY ACCESS CONFIRMED
PRIORITY ID: ${priorityId}

Hello${name ? ` ${name}` : ""},

Thank you for registering your interest in HOROS. Your account (${normalizedEmail}) has been successfully placed in our priority access queue.

QUEUE STATUS: ACCESS RESERVED
REGISTERED EMAIL: ${normalizedEmail}
METHOD: ${provider.toUpperCase()}

We will contact you as soon as our early access rollout begins. When we launch, you will receive immediate first-wave credentials before public availability.

If you require an early technical demo or architecture review:
https://cal.com/vegito

--
HOROS Infrastructure Group
https://horoslab.io`;

  // Path A: Resend API if key is present
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: normalizedEmail,
          subject,
          html: htmlContent,
          text: textContent,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        console.info(`[HOROS Email] Sent via Resend to ${normalizedEmail} (ID: ${data?.id})`);
        return { success: true, messageId: data?.id };
      }
      console.warn("[HOROS Email] Resend API returned error:", data);
    } catch (err: any) {
      console.error("[HOROS Email] Resend fetch error:", err);
    }
  }

  // Path B: Standard SMTP via nodemailer if SMTP credentials present
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: fromAddress,
        to: normalizedEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.info(`[HOROS Email] Real-time email delivered via SMTP to ${normalizedEmail} (MessageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error("[HOROS Email] SMTP sendMail error:", err);
      return { success: false, error: err?.message };
    }
  }

  // Path C: Local dev / preview mode logging
  console.info(`[HOROS Email Simulation] Recorded signup for ${normalizedEmail} (${provider}). Configure SMTP_HOST/USER/PASS or RESEND_API_KEY in .env.local for live dispatch.`);
  return {
    success: true,
    simulated: true,
    messageId: `sim_${Date.now()}`,
  };
}

