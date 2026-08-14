import { SlackClient } from "../../integrations/slack";
import type { ExecutionAdapterResult, ExecutionRiskTier, ExecutionScope } from "../executionTypes";
import type { ExecutionAdapter } from "./executionAdapterTypes";
import { loadConnectorCredentials } from "./executionConnectorAccess";

const SLACK_MESSAGE_ACTIONS = new Set(["channel_message", "post_message"]);

function parseSlackMessagePayload(payload: Record<string, unknown>): {
  channel: string;
  text: string;
  threadTs?: string;
} {
  const channel = typeof payload.channel === "string" ? payload.channel.trim() : "";
  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  const threadTs = typeof payload.threadTs === "string" ? payload.threadTs.trim() : undefined;
  if (!channel) {
    throw new Error('Slack proposals require payload.channel (channel id or name).');
  }
  if (!text) {
    throw new Error('Slack proposals require payload.text.');
  }
  return { channel, text, threadTs };
}

export const slackExecutionAdapter: ExecutionAdapter = {
  id: "slack",
  inferRiskTier(actionType) {
    if (SLACK_MESSAGE_ACTIONS.has(actionType)) return "low";
    return "high";
  },
  async validatePropose(scope, actionType, payload) {
    if (!SLACK_MESSAGE_ACTIONS.has(actionType)) {
      throw new Error(
        `Unsupported Slack action "${actionType}". Supported: channel_message, post_message.`,
      );
    }
    parseSlackMessagePayload(payload);
    const { accessToken } = await loadConnectorCredentials(scope, "slack");
    await SlackClient.verifyAccessToken(accessToken);
  },
  async execute(scope, actionType, payload): Promise<ExecutionAdapterResult> {
    if (!SLACK_MESSAGE_ACTIONS.has(actionType)) {
      return {
        ok: false,
        detail: `Unsupported Slack action "${actionType}".`,
      };
    }
    const { channel, text, threadTs } = parseSlackMessagePayload(payload);
    const { accessToken } = await loadConnectorCredentials(scope, "slack");
    const posted = await SlackClient.postChannelMessage({
      accessToken,
      channel,
      text,
      threadTs,
    });
    const externalRef = posted.ts
      ? `slack://${posted.channel}/${posted.ts}`
      : `slack://${posted.channel}`;
    return {
      ok: true,
      detail: `Posted Slack message to ${posted.channel}.`,
      externalRef,
      data: { channel: posted.channel, messageTs: posted.ts ?? null },
    };
  },
};
