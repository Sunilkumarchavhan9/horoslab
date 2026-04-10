import { JsonWorkflowStateAdapter } from "./jsonWorkflowStateAdapter";

export interface WorkflowStateAdapter {
  saveCheckpoint(input: {
    key: string;
    state: Record<string, unknown>;
  }): Promise<void>;
  loadCheckpoint(input: { key: string }): Promise<Record<string, unknown> | null>;
}

let workflowStateAdapterOverride: WorkflowStateAdapter | null = null;
const defaultWorkflowStateAdapter = new JsonWorkflowStateAdapter();

export function setWorkflowStateAdapter(adapter: WorkflowStateAdapter): void {
  workflowStateAdapterOverride = adapter;
}

export function resetWorkflowStateAdapter(): void {
  workflowStateAdapterOverride = null;
}

export function getWorkflowStateAdapter(): WorkflowStateAdapter {
  return workflowStateAdapterOverride ?? defaultWorkflowStateAdapter;
}
