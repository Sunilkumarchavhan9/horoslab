import type { RuntimeBusMetrics, RuntimeContext, RuntimeEvent } from "./RuntimeBus";
import { RuntimeBus } from "./RuntimeBus";
import { createRuntimeLogger, type RuntimeLogger } from "./RuntimeLogger";
import { createRuntimeMetrics, type RuntimeMetrics } from "./RuntimeMetrics";
import { RuntimeLifecycle } from "./RuntimeLifecycle";

export interface RuntimeBaseOptions<TEvent extends RuntimeEvent = RuntimeEvent> {
  runtimeName: string;
  runtimeContext: RuntimeContext;
  runtimeBus?: RuntimeBus<TEvent>;
  logger?: RuntimeLogger;
}

export abstract class RuntimeBase<TEvent extends RuntimeEvent = RuntimeEvent> {
  protected readonly runtimeName: string;

  protected readonly runtimeContext: RuntimeContext;

  protected readonly runtimeBus: RuntimeBus<TEvent>;

  protected readonly logger: RuntimeLogger;

  protected readonly metrics: RuntimeMetrics;

  protected readonly lifecycle: RuntimeLifecycle;

  protected constructor(options: RuntimeBaseOptions<TEvent>) {
    this.runtimeName = options.runtimeName;
    this.runtimeContext = { ...options.runtimeContext };
    this.runtimeBus =
      options.runtimeBus ?? new RuntimeBus<TEvent>({ defaultContext: this.runtimeContext });
    this.logger = options.logger ?? createRuntimeLogger(this.runtimeName);
    this.metrics = createRuntimeMetrics(this.runtimeBus);
    this.lifecycle = new RuntimeLifecycle();
  }

  protected registerLifecycle(cleanup: () => void | Promise<void>): () => void | Promise<void> {
    return this.lifecycle.register(cleanup);
  }

  protected unregisterLifecycle(cleanup: () => void | Promise<void>): boolean {
    return this.lifecycle.unregister(cleanup);
  }

  protected shutdownLifecycle(): Promise<void> {
    return this.lifecycle.shutdown();
  }

  protected clearLifecycle(): void {
    this.lifecycle.clear();
  }

  protected runtimeMetrics(): RuntimeBusMetrics {
    return this.runtimeBus.metrics();
  }
}
