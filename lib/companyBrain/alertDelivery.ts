export type AlertLevel = "info" | "warning" | "critical";

export type AlertMessage = {
  userId: string;
  level: AlertLevel;
  message: string;
  at: string;
  context?: Record<string, unknown>;
};

export interface AlertSink {
  deliver(input: AlertMessage): Promise<void>;
}

class WebhookSink implements AlertSink {
  async deliver(input: AlertMessage): Promise<void> {
    const url = process.env.COMPANY_BRAIN_ALERT_WEBHOOK_URL?.trim();
    if (!url) return;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  }
}

class SlackSink implements AlertSink {
  async deliver(input: AlertMessage): Promise<void> {
    const webhook = process.env.COMPANY_BRAIN_SLACK_WEBHOOK_URL?.trim();
    if (!webhook) return;
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `[${input.level.toUpperCase()}] ${input.message}`,
        attachments: input.context ? [{ text: JSON.stringify(input.context) }] : undefined,
      }),
    });
  }
}

class EmailSink implements AlertSink {
  async deliver(input: AlertMessage): Promise<void> {
    // Pluggable hook point for SMTP/provider integration.
    // If target exists, keep a no-op side effect in logs for now.
    const to = process.env.COMPANY_BRAIN_ALERT_EMAIL_TO?.trim();
    if (!to) return;
    if (
      input.level === "info" &&
      process.env.COMPANY_BRAIN_ALERT_LOG_INFO !== "true"
    ) {
      return;
    }
    console.log("[company-brain][alert-email]", { to, level: input.level, message: input.message, at: input.at });
  }
}

const sinks: AlertSink[] = [new WebhookSink(), new SlackSink(), new EmailSink()];

export async function deliverAlert(input: AlertMessage): Promise<void> {
  await Promise.allSettled(sinks.map((sink) => sink.deliver(input)));
}

