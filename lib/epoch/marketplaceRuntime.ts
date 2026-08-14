import { createHmac, timingSafeEqual } from "node:crypto";

export const EPOCH_MARKETPLACE_ASSET_KINDS = ["worker", "integration", "mission_template", "verifier_pack", "policy", "provider_adapter"] as const;
export type EpochMarketplaceAssetKind = (typeof EPOCH_MARKETPLACE_ASSET_KINDS)[number];
export type EpochMarketplaceManifest = { id: string; version: string; kind: EpochMarketplaceAssetKind; publisherId: string; compatibleApi: string; permissions: string[]; contentHash: string; signature: string; status: "active" | "revoked" };

function manifestPayload(manifest: Omit<EpochMarketplaceManifest, "signature" | "status">): string {
  return JSON.stringify({ ...manifest, permissions: [...manifest.permissions].sort() });
}

export function signEpochMarketplaceManifest(manifest: Omit<EpochMarketplaceManifest, "signature" | "status">, secret: string): string { return createHmac("sha256", secret).update(manifestPayload(manifest)).digest("hex"); }
export function verifyEpochMarketplaceManifest(manifest: EpochMarketplaceManifest, secret: string): boolean {
  if (manifest.status === "revoked") return false;
  const { signature: _signature, status: _status, ...unsignedManifest } = manifest;
  const expected = signEpochMarketplaceManifest(unsignedManifest, secret);
  const actual = Buffer.from(manifest.signature, "hex"); const target = Buffer.from(expected, "hex");
  return actual.length === target.length && timingSafeEqual(actual, target);
}

export function validateEpochMarketplaceManifest(manifest: EpochMarketplaceManifest): void {
  if (!manifest.id || !manifest.version || !manifest.publisherId || !manifest.contentHash) throw new Error("epoch_marketplace_manifest_incomplete");
  if (!manifest.compatibleApi.startsWith("v")) throw new Error("epoch_marketplace_api_version_invalid");
  if (new Set(manifest.permissions).size !== manifest.permissions.length) throw new Error("epoch_marketplace_permissions_duplicate");
}

export class EpochPrivateMarketplace {
  private readonly manifests = new Map<string, EpochMarketplaceManifest>();
  publish(manifest: EpochMarketplaceManifest, secret: string): EpochMarketplaceManifest {
    validateEpochMarketplaceManifest(manifest);
    if (!verifyEpochMarketplaceManifest(manifest, secret)) throw new Error("epoch_marketplace_signature_invalid");
    const key = `${manifest.id}@${manifest.version}`;
    if (this.manifests.has(key)) throw new Error("epoch_marketplace_version_already_exists");
    this.manifests.set(key, { ...manifest, permissions: [...manifest.permissions] });
    return this.manifests.get(key)!;
  }
  revoke(id: string, version: string): EpochMarketplaceManifest | null {
    const key = `${id}@${version}`; const manifest = this.manifests.get(key);
    if (!manifest) return null;
    const revoked = { ...manifest, status: "revoked" as const }; this.manifests.set(key, revoked); return revoked;
  }
  get(id: string, version: string): EpochMarketplaceManifest | null { return this.manifests.get(`${id}@${version}`) ?? null; }
}
