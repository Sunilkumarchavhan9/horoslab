import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import path from "path";
import type { WorkflowStateAdapter } from "./workflowStateAdapter";

type WorkflowStateStore = Record<string, Record<string, unknown>>;

export class JsonWorkflowStateAdapter implements WorkflowStateAdapter {
  constructor(
    private readonly filePath = path.join(process.cwd(), "data", "workflow-state.json"),
  ) {}

  private ensureStore(): void {
    const dir = path.dirname(this.filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    if (!existsSync(this.filePath)) {
      writeFileSync(this.filePath, "{}", "utf8");
    }
  }

  private readStore(): WorkflowStateStore {
    this.ensureStore();

    try {
      const raw = readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as WorkflowStateStore;
      }
      return {};
    } catch {
      return {};
    }
  }

  private writeStore(store: WorkflowStateStore): void {
    this.ensureStore();

    const tmpPath = `${this.filePath}.tmp`;
    writeFileSync(tmpPath, JSON.stringify(store, null, 2), "utf8");
    renameSync(tmpPath, this.filePath);
  }

  async saveCheckpoint(input: {
    key: string;
    state: Record<string, unknown>;
  }): Promise<void> {
    const store = this.readStore();
    store[input.key] = input.state;
    this.writeStore(store);
  }

  async loadCheckpoint(input: { key: string }): Promise<Record<string, unknown> | null> {
    const store = this.readStore();
    return store[input.key] ?? null;
  }
}
