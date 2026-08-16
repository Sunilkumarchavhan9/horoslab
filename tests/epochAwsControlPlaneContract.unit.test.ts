import { describe, expect, it } from "vitest";
import { inspectEpochAwsControlPlane } from "../lib/epoch/awsControlPlaneContract";

const readyEnv = {
  AWS_DEFAULT_REGION: "ap-south-1",
  AWS_PROFILE: "epoch-deployer",
  EPOCH_ARTIFACT_BUCKET: "epoch-artifacts-123456789012-ap-south-1",
  EPOCH_ECR_BACKEND_REPOSITORY: "epoch-backend",
  EPOCH_ECR_WORKER_REPOSITORY: "epoch-worker",
  EPOCH_ECR_FRONTEND_REPOSITORY: "epoch-frontend",
  EPOCH_SQS_MISSIONS_URL: "https://sqs.ap-south-1.amazonaws.com/123456789012/epoch-production-missions",
  EPOCH_SQS_RUNTIME_URL: "https://sqs.ap-south-1.amazonaws.com/123456789012/epoch-production-runtime",
  EPOCH_SQS_DEAD_LETTER_URL: "https://sqs.ap-south-1.amazonaws.com/123456789012/epoch-production-dead-letter",
  DATABASE_URL: "postgresql://epoch:secret@aurora.example:5432/epoch",
  REDIS_URL: "rediss://redis.example:6380",
  EPOCH_AWS_SECRET_ARN: "arn:aws:secretsmanager:ap-south-1:123456789012:secret:epoch/production",
  EPOCH_ECS_CLUSTER: "epoch-production",
  EPOCH_ECS_API_SERVICE: "epoch-api",
  EPOCH_ECS_WORKER_SERVICE: "epoch-worker",
  EPOCH_CLOUDWATCH_API_LOG_GROUP: "/epoch/production/api",
  EPOCH_CLOUDWATCH_WORKER_LOG_GROUP: "/epoch/production/worker",
};

describe("AWS control-plane contract", () => {
  it("is READY only when every required production binding is present", () => {
    const result = inspectEpochAwsControlPlane(readyEnv);
    expect(result.status).toBe("READY");
    expect(result.resources.every((resource) => resource.status === "READY")).toBe(true);
    expect(result.evidenceSha256).toHaveLength(64);
  });

  it("reports missing infrastructure truthfully", () => {
    const result = inspectEpochAwsControlPlane({ AWS_DEFAULT_REGION: "ap-south-1" });
    expect(result.status).toBe("MISSING");
    expect(result.requiredActions).toContain("resolve_artifact_bucket_not_configured");
    expect(result.requiredActions).toContain("resolve_cluster_not_configured");
  });

  it("rejects malformed region and connection bindings", () => {
    const result = inspectEpochAwsControlPlane({
      AWS_DEFAULT_REGION: "india",
      DATABASE_URL: "sqlite://local",
      REDIS_URL: "http://localhost:6379",
      EPOCH_AWS_SECRET_ARN: "secret-name",
    });
    expect(result.status).toBe("INVALID");
    expect(result.requiredActions).toEqual(expect.arrayContaining([
      "configure_a_valid_aws_region",
      "resolve_database_url_must_be_postgresql",
      "resolve_redis_url_must_be_redis_uri",
      "resolve_secret_arn_must_be_aws_arn",
    ]));
  });
});

