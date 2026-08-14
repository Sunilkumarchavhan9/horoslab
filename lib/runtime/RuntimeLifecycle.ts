export type RuntimeCleanup = () => void | Promise<void>;

export class RuntimeLifecycle {
  private readonly teardowns = new Set<RuntimeCleanup>();

  register(cleanup: RuntimeCleanup): RuntimeCleanup {
    this.teardowns.add(cleanup);
    return cleanup;
  }

  unregister(cleanup: RuntimeCleanup): boolean {
    return this.teardowns.delete(cleanup);
  }

  clear(): void {
    this.teardowns.clear();
  }

  async shutdown(): Promise<void> {
    const teardowns = [...this.teardowns];
    this.teardowns.clear();
    for (const teardown of teardowns) {
      await teardown();
    }
  }

  count(): number {
    return this.teardowns.size;
  }
}
