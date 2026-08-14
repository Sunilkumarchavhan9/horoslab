export type EpochEncryptionMode = "external_kms" | "provider_managed" | "local_secret";
export type EpochEncryptionConfig = { mode: EpochEncryptionMode; keyReference: string; enterpriseGrade: boolean };
export type EpochProductionStorageConfig = { endpoint: string; bucket: string; region: string; accessKeyId: string; secretAccessKey: string; kmsKeyReference: string; encryptionMode: EpochEncryptionMode };

export function readEpochEncryptionConfig(env: NodeJS.ProcessEnv = process.env): EpochEncryptionConfig {
  const mode = (env.EPOCH_ENCRYPTION_MODE?.trim() || "external_kms") as EpochEncryptionMode;
  if (!["external_kms", "provider_managed", "local_secret"].includes(mode)) {
    throw new Error("epoch_encryption_mode_invalid");
  }
  if (mode === "local_secret") {
    const secret = env.EPOCH_KMS_SECRET?.trim();
    if (!secret || secret.length < 32) throw new Error("epoch_local_encryption_secret_too_short");
    return { mode, keyReference: "env:EPOCH_KMS_SECRET", enterpriseGrade: false };
  }
  const keyReference = env.EPOCH_KMS_KEY_REFERENCE?.trim();
  if (!keyReference) throw new Error("epoch_kms_key_reference_missing");
  return { mode, keyReference, enterpriseGrade: mode === "external_kms" };
}

export function readEpochProductionStorageConfig(env: NodeJS.ProcessEnv = process.env): EpochProductionStorageConfig {
  const required = {
    endpoint: env.EPOCH_OBJECT_STORAGE_ENDPOINT,
    bucket: env.EPOCH_OBJECT_STORAGE_BUCKET,
    region: env.EPOCH_OBJECT_STORAGE_REGION,
    accessKeyId: env.EPOCH_OBJECT_STORAGE_ACCESS_KEY_ID,
    secretAccessKey: env.EPOCH_OBJECT_STORAGE_SECRET_ACCESS_KEY,
  };
  const missing = Object.entries(required).filter(([, value]) => !value?.trim()).map(([key]) => key);
  if (missing.length > 0) throw new Error(`epoch_production_storage_config_missing:${missing.join(",")}`);
  if (!/^https:\/\//i.test(required.endpoint!)) throw new Error("epoch_production_storage_endpoint_must_use_https");
  const encryption = readEpochEncryptionConfig(env);
  return { ...required, kmsKeyReference: encryption.keyReference, encryptionMode: encryption.mode } as EpochProductionStorageConfig;
}
