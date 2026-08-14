import { describe, expect, it } from "vitest";
import { readEpochEncryptionConfig, readEpochProductionStorageConfig } from "../lib/epoch/productionConfig";

describe("production storage configuration", () => {
  it("requires external encrypted storage and KMS references", () => {
    expect(() => readEpochProductionStorageConfig({})).toThrow("epoch_production_storage_config_missing");
    expect(() => readEpochProductionStorageConfig({ EPOCH_OBJECT_STORAGE_ENDPOINT: "http://spaces.example", EPOCH_OBJECT_STORAGE_BUCKET: "b", EPOCH_OBJECT_STORAGE_REGION: "eu", EPOCH_OBJECT_STORAGE_ACCESS_KEY_ID: "a", EPOCH_OBJECT_STORAGE_SECRET_ACCESS_KEY: "s", EPOCH_KMS_KEY_REFERENCE: "kms/key" })).toThrow("https");
  });

  it("accepts a complete HTTPS production configuration", () => {
    const config = readEpochProductionStorageConfig({ EPOCH_OBJECT_STORAGE_ENDPOINT: "https://nyc3.digitaloceanspaces.com", EPOCH_OBJECT_STORAGE_BUCKET: "epoch-prod", EPOCH_OBJECT_STORAGE_REGION: "nyc3", EPOCH_OBJECT_STORAGE_ACCESS_KEY_ID: "access", EPOCH_OBJECT_STORAGE_SECRET_ACCESS_KEY: "secret", EPOCH_KMS_KEY_REFERENCE: "kms/epoch-prod" });
    expect(config.bucket).toBe("epoch-prod");
    expect(config.encryptionMode).toBe("external_kms");
  });

  it("supports an explicit budget encryption mode without calling it enterprise KMS", () => {
    const encryption = readEpochEncryptionConfig({ EPOCH_ENCRYPTION_MODE: "local_secret", EPOCH_KMS_SECRET: "a".repeat(32) });
    expect(encryption).toEqual({ mode: "local_secret", keyReference: "env:EPOCH_KMS_SECRET", enterpriseGrade: false });
    expect(() => readEpochEncryptionConfig({ EPOCH_ENCRYPTION_MODE: "local_secret", EPOCH_KMS_SECRET: "short" })).toThrow("epoch_local_encryption_secret_too_short");
  });
});
