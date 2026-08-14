import type {
  ExecutionAdapterResult,
  ExecutionRiskTier,
  ExecutionScope,
} from "../executionTypes";

export type ExecutionAdapter = {
  id: string;
  inferRiskTier(actionType: string, payload: Record<string, unknown>): ExecutionRiskTier;
  validatePropose(
    scope: ExecutionScope,
    actionType: string,
    payload: Record<string, unknown>,
  ): Promise<void>;
  execute(
    scope: ExecutionScope,
    actionType: string,
    payload: Record<string, unknown>,
  ): Promise<ExecutionAdapterResult>;
};
