import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "fs";
import path from "path";
import type { WorkflowStateAdapter } from "./adapters";

type WorkflowStateStore = Record<string, Record<string, unknown>>;
const MAX_CHECKPOINT_BYTES = 250_000;

function safeSerializeStore(store: WorkflowStateStore): string {
  try {
    return JSON.stringify(store, null, 2);
  } catch (error) {
    if (error instanceof RangeError) {
      return JSON.stringify({}, null, 2);
    }
    throw error;
  }
}

export class JsonWorkflowStateAdapter implements WorkflowStateAdapter {
  private static writeQueue: Promise<void> = Promise.resolve();

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

    const tmpPath = `${this.filePath}.${process.pid}.${Date.now()}.${Math.random()
      .toString(16)
      .slice(2)}.tmp`;
    let serialized = safeSerializeStore(store);
    if (serialized.length > MAX_CHECKPOINT_BYTES) {
      const compactEntries = Object.entries(store).slice(-25);
      serialized = safeSerializeStore(Object.fromEntries(compactEntries));
    }
    try {
      writeFileSync(tmpPath, serialized, "utf8");
      try {
        renameSync(tmpPath, this.filePath);
      } catch {
        copyFileSync(tmpPath, this.filePath);
      }
    } finally {
      if (existsSync(tmpPath)) {
        rmSync(tmpPath, { force: true });
      }
    }
  }

  async saveCheckpoint(input: {
    key: string;
    state: Record<string, unknown>;
  }): Promise<void> {
    const write = async () => {
      const store = this.readStore();
      store[input.key] = input.state;
      this.writeStore(store);
    };
    const result = JsonWorkflowStateAdapter.writeQueue.then(write, write);
    JsonWorkflowStateAdapter.writeQueue = result.catch(() => undefined);
    await result;
  }

  async loadCheckpoint(input: { key: string }): Promise<Record<string, unknown> | null> {
    const store = this.readStore();
    return store[input.key] ?? null;
  }
}
