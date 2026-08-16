import {
  ChangeMessageVisibilityCommand,
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  SQSClient,
  type Message,
} from "@aws-sdk/client-sqs";
import type { EpochQueueJob } from "./epochQueue";

/**
 * AWS SQS transport for Epoch jobs.
 *
 * PostgreSQL remains the source of truth for job state. SQS only carries the
 * delivery envelope and its visibility timeout. This keeps local Redis/
 * PostgreSQL execution unchanged and makes the AWS transport opt-in.
 */
export type EpochSqsDelivery = {
  job: EpochQueueJob;
  receiptHandle: string;
  receivedAt: string;
};

export type EpochSqsTransportConfig = {
  queueUrl: string;
  region?: string;
  visibilityTimeoutSeconds?: number;
  waitTimeSeconds?: number;
  maxInFlight?: number;
};

const receipts = new Map<string, string>();

function positiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(max, Math.floor(parsed));
}

function client(region?: string): SQSClient {
  return new SQSClient({ region: region ?? process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION });
}

export function epochSqsConfigFromEnv(env: NodeJS.ProcessEnv = process.env): EpochSqsTransportConfig | null {
  const queueUrl = env.EPOCH_SQS_MISSIONS_URL ?? env.EPOCH_SQS_RUNTIME_URL;
  if (!queueUrl) return null;
  return {
    queueUrl,
    region: env.AWS_REGION ?? env.AWS_DEFAULT_REGION,
    visibilityTimeoutSeconds: positiveInt(env.EPOCH_SQS_VISIBILITY_TIMEOUT_SECONDS, 900, 43_200),
    waitTimeSeconds: positiveInt(env.EPOCH_SQS_WAIT_TIME_SECONDS, 10, 20),
    maxInFlight: positiveInt(env.EPOCH_SQS_MAX_IN_FLIGHT, 50, 10_000),
  };
}

function parseJob(message: Message): EpochQueueJob | null {
  if (!message.Body || !message.ReceiptHandle) return null;
  try {
    const value = JSON.parse(message.Body) as EpochQueueJob;
    if (!value || typeof value.id !== "string" || typeof value.workspaceId !== "string" || typeof value.type !== "string") return null;
    return value;
  } catch {
    return null;
  }
}

export async function sendEpochJobToSqs(job: EpochQueueJob, config: EpochSqsTransportConfig): Promise<{ messageId?: string }> {
  const result = await client(config.region).send(new SendMessageCommand({
    QueueUrl: config.queueUrl,
    MessageBody: JSON.stringify(job),
    MessageAttributes: {
      epochJobType: { DataType: "String", StringValue: job.type },
      epochWorkspaceId: { DataType: "String", StringValue: job.workspaceId },
    },
  }));
  return { messageId: result.MessageId };
}

export async function requeueEpochJobToSqs(job: EpochQueueJob, config: EpochSqsTransportConfig, delayMs = 0): Promise<{ messageId?: string }> {
  const result = await client(config.region).send(new SendMessageCommand({
    QueueUrl: config.queueUrl,
    MessageBody: JSON.stringify({ ...job, status: "queued", leasedAt: undefined, leaseOwner: undefined }),
    DelaySeconds: Math.min(900, Math.max(0, Math.floor(delayMs / 1000))),
  }));
  return { messageId: result.MessageId };
}

/** Receives at most the configured backpressure window and hides messages. */
export async function receiveEpochJobsFromSqs(config: EpochSqsTransportConfig): Promise<EpochSqsDelivery[]> {
  const maxInFlight = config.maxInFlight ?? 50;
  const available = Math.max(0, maxInFlight - receipts.size);
  if (available === 0) return [];
  const maxNumber = Math.min(10, available);
  const result = await client(config.region).send(new ReceiveMessageCommand({
    QueueUrl: config.queueUrl,
    MaxNumberOfMessages: maxNumber,
    WaitTimeSeconds: config.waitTimeSeconds ?? 10,
    VisibilityTimeout: config.visibilityTimeoutSeconds ?? 900,
    MessageSystemAttributeNames: ["MessageGroupId", "ApproximateReceiveCount"],
  }));
  const deliveries: EpochSqsDelivery[] = [];
  for (const message of result.Messages ?? []) {
    const job = parseJob(message);
    if (!job || !message.ReceiptHandle) continue;
    receipts.set(job.id, message.ReceiptHandle);
    deliveries.push({ job, receiptHandle: message.ReceiptHandle, receivedAt: new Date().toISOString() });
  }
  return deliveries;
}

export async function renewEpochSqsLease(jobId: string, config: EpochSqsTransportConfig, visibilityTimeoutSeconds = config.visibilityTimeoutSeconds ?? 900): Promise<boolean> {
  const receiptHandle = receipts.get(jobId);
  if (!receiptHandle) return false;
  await client(config.region).send(new ChangeMessageVisibilityCommand({ QueueUrl: config.queueUrl, ReceiptHandle: receiptHandle, VisibilityTimeout: positiveInt(visibilityTimeoutSeconds, 900, 43_200) }));
  return true;
}

export async function acknowledgeEpochSqsJob(jobId: string, config: EpochSqsTransportConfig): Promise<boolean> {
  const receiptHandle = receipts.get(jobId);
  if (!receiptHandle) return false;
  await client(config.region).send(new DeleteMessageCommand({ QueueUrl: config.queueUrl, ReceiptHandle: receiptHandle }));
  receipts.delete(jobId);
  return true;
}

/** Releases a message immediately so a failed worker can be retried. */
export async function releaseEpochSqsJob(jobId: string, config: EpochSqsTransportConfig): Promise<boolean> {
  const receiptHandle = receipts.get(jobId);
  if (!receiptHandle) return false;
  await client(config.region).send(new ChangeMessageVisibilityCommand({ QueueUrl: config.queueUrl, ReceiptHandle: receiptHandle, VisibilityTimeout: 0 }));
  receipts.delete(jobId);
  return true;
}

export function epochSqsInFlightCount(): number {
  return receipts.size;
}

export function resetEpochSqsTransportForTests(): void {
  receipts.clear();
}
