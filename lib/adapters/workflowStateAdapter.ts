import { JsonWorkflowStateAdapter } from "./jsonWorkflowStateAdapter";
import type { WorkflowStateAdapter } from "./adapters";

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
