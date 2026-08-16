import { describe, expect, it } from "vitest";
import { epochSqsConfigFromEnv } from "../lib/epoch/awsSqsQueueTransport";

describe("Epoch SQS transport contract", () => {
  it("is disabled without an AWS queue URL", () => {
    expect(epochSqsConfigFromEnv({})).toBeNull();
  });

  it("normalizes bounded visibility and backpressure settings", () => {
    const config = epochSqsConfigFromEnv({
      EPOCH_SQS_MISSIONS_URL: "https://sqs.ap-south-1.amazonaws.com/123/epoch",
      AWS_REGION: "ap-south-1",
      EPOCH_SQS_VISIBILITY_TIMEOUT_SECONDS: "50000",
      EPOCH_SQS_WAIT_TIME_SECONDS: "99",
      EPOCH_SQS_MAX_IN_FLIGHT: "7",
    });
    expect(config).toEqual({
      queueUrl: "https://sqs.ap-south-1.amazonaws.com/123/epoch",
      region: "ap-south-1",
      visibilityTimeoutSeconds: 43200,
      waitTimeSeconds: 20,
      maxInFlight: 7,
    });
  });
});
