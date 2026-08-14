export const EPOCH_API_VERSION = "v1" as const;
export const EPOCH_CONTRACT_VERSION = "epoch.v12" as const;

export type EpochApiVersionInfo = {
  apiVersion: typeof EPOCH_API_VERSION;
  contractVersion: typeof EPOCH_CONTRACT_VERSION;
  status: "current";
  compatibility: {
    supported: [typeof EPOCH_API_VERSION];
    deprecated: [];
  };
};

export function getEpochApiVersionInfo(): EpochApiVersionInfo {
  return {
    apiVersion: EPOCH_API_VERSION,
    contractVersion: EPOCH_CONTRACT_VERSION,
    status: "current",
    compatibility: {
      supported: [EPOCH_API_VERSION],
      deprecated: [],
    },
  };
}
