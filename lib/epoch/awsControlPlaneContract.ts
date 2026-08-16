import { createHash } from "node:crypto";

export type EpochAwsResourceKind =
  | "s3"
  | "ecr"
  | "sqs"
  | "database"
  | "redis"
  | "secrets"
  | "ecs"
  | "observability";

export type EpochAwsResourceStatus = "READY" | "MISSING" | "INVALID";

export type EpochAwsResourceCheck = {
  kind: EpochAwsResourceKind;
  status: EpochAwsResourceStatus;
  configured: string[];
  missing: string[];
  reasons: string[];
};

export type EpochAwsControlPlaneContract = {
  version: "epoch_aws_control_plane_contract.v1";
  provider: "aws";
  region: string | null;
  profile: string | null;
  status: "READY" | "MISSING" | "INVALID";
  resources: EpochAwsResourceCheck[];
  requiredActions: string[];
  evidenceSha256: string;
};

type Env = Record<string, string | undefined>;

function value(env: Env, name: string): string | null {
  const candidate = env[name]?.trim();
  return candidate ? candidate : null;
}

function resource(
  kind: EpochAwsResourceKind,
  configured: string[],
  required: string[],
  invalid: string[] = [],
): EpochAwsResourceCheck {
  const missing = required.filter((item) => !configured.includes(item));
  const reasons = [
    ...missing.map((item) => `${item}_not_configured`),
    ...invalid,
  ];
  return {
    kind,
    status: invalid.length ? "INVALID" : missing.length ? "MISSING" : "READY",
    configured,
    missing,
    reasons,
  };
}

function validAwsRegion(region: string | null): boolean {
  return Boolean(region && /^[a-z]{2}(?:-gov)?-[a-z]+-\d$/.test(region));
}

function validArn(valueToCheck: string | null): boolean {
  return Boolean(valueToCheck && /^arn:aws:[a-z0-9-]+:[a-z0-9-]*:\d{12}:.+$/i.test(valueToCheck));
}

export function inspectEpochAwsControlPlane(env: Env = process.env): EpochAwsControlPlaneContract {
  const region = value(env, "AWS_REGION") ?? value(env, "AWS_DEFAULT_REGION");
  const profile = value(env, "AWS_PROFILE");
  const databaseUrl = value(env, "DATABASE_URL");
  const redisUrl = value(env, "REDIS_URL") ?? value(env, "EPOCH_REDIS_URL");
  const secretArn = value(env, "EPOCH_AWS_SECRET_ARN") ?? value(env, "AWS_SECRET_ARN");
  const cluster = value(env, "EPOCH_ECS_CLUSTER");
  const apiService = value(env, "EPOCH_ECS_API_SERVICE");
  const workerService = value(env, "EPOCH_ECS_WORKER_SERVICE");
  const bucket = value(env, "EPOCH_ARTIFACT_BUCKET");
  const apiRepository = value(env, "EPOCH_ECR_BACKEND_REPOSITORY");
  const workerRepository = value(env, "EPOCH_ECR_WORKER_REPOSITORY");
  const frontendRepository = value(env, "EPOCH_ECR_FRONTEND_REPOSITORY");
  const missionQueue = value(env, "EPOCH_SQS_MISSIONS_URL");
  const runtimeQueue = value(env, "EPOCH_SQS_RUNTIME_URL");
  const deadLetterQueue = value(env, "EPOCH_SQS_DEAD_LETTER_URL");
  const logGroupApi = value(env, "EPOCH_CLOUDWATCH_API_LOG_GROUP");
  const logGroupWorker = value(env, "EPOCH_CLOUDWATCH_WORKER_LOG_GROUP");

  const resources: EpochAwsResourceCheck[] = [
    resource("s3", bucket ? ["artifact_bucket"] : [], ["artifact_bucket"]),
    resource(
      "ecr",
      [
        ...(apiRepository ? ["backend_repository"] : []),
        ...(workerRepository ? ["worker_repository"] : []),
        ...(frontendRepository ? ["frontend_repository"] : []),
      ],
      ["backend_repository", "worker_repository", "frontend_repository"],
    ),
    resource(
      "sqs",
      [
        ...(missionQueue ? ["missions_queue"] : []),
        ...(runtimeQueue ? ["runtime_queue"] : []),
        ...(deadLetterQueue ? ["dead_letter_queue"] : []),
      ],
      ["missions_queue", "runtime_queue", "dead_letter_queue"],
    ),
    resource(
      "database",
      databaseUrl ? ["database_url"] : [],
      ["database_url"],
      databaseUrl && !/^postgres(?:ql)?:\/\//i.test(databaseUrl) ? ["database_url_must_be_postgresql"] : [],
    ),
    resource(
      "redis",
      redisUrl ? ["redis_url"] : [],
      ["redis_url"],
      redisUrl && !/^(rediss?|redis):\/\//i.test(redisUrl) ? ["redis_url_must_be_redis_uri"] : [],
    ),
    resource(
      "secrets",
      secretArn ? ["secret_arn"] : [],
      ["secret_arn"],
      secretArn && !validArn(secretArn) ? ["secret_arn_must_be_aws_arn"] : [],
    ),
    resource(
      "ecs",
      [
        ...(cluster ? ["cluster"] : []),
        ...(apiService ? ["api_service"] : []),
        ...(workerService ? ["worker_service"] : []),
      ],
      ["cluster", "api_service", "worker_service"],
    ),
    resource(
      "observability",
      [
        ...(logGroupApi ? ["api_log_group"] : []),
        ...(logGroupWorker ? ["worker_log_group"] : []),
      ],
      ["api_log_group", "worker_log_group"],
    ),
  ];

  const invalidRegion = !validAwsRegion(region);
  const requiredActions = [
    ...(invalidRegion ? ["configure_a_valid_aws_region"] : []),
    ...resources.flatMap((check) => check.reasons.map((reason) => `resolve_${reason}`)),
  ];
  const status: EpochAwsControlPlaneContract["status"] = invalidRegion || resources.some((check) => check.status === "INVALID")
    ? "INVALID"
    : resources.some((check) => check.status === "MISSING")
      ? "MISSING"
      : "READY";
  const unsigned = { version: "epoch_aws_control_plane_contract.v1" as const, provider: "aws" as const, region, profile, status, resources, requiredActions };
  const evidenceSha256 = createHash("sha256").update(JSON.stringify(unsigned)).digest("hex");
  return { ...unsigned, evidenceSha256 };
}
