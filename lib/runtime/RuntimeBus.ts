import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

export type RuntimeName = string;
export type RuntimeEventType = string;

export interface RuntimeContext {
  institutionId: string;
  workspaceId?: string;
  missionId?: string;
  actorId?: string;
  requestId?: string;
  sessionId?: string;
  traceId?: string;
}

export interface RuntimeEvent<TType extends RuntimeEventType = RuntimeEventType, TPayload = unknown> {
  id: string;
  type: TType;
  runtime: RuntimeName;
  timestamp: Date;
  correlationId: string;
  causationId?: string;
  version: 1;
  context: RuntimeContext;
  payload: TPayload;
  metadata?: Record<string, unknown>;
}

export interface RuntimeEventInput<TType extends RuntimeEventType = RuntimeEventType, TPayload = unknown> {
  id: string;
  type: TType;
  runtime: RuntimeName;
  timestamp: Date | string;
  correlationId?: string;
  causationId?: string;
  version?: 1;
  context?: Partial<RuntimeContext>;
  payload: TPayload;
  metadata?: Record<string, unknown>;
}

export interface RuntimeEventFilter<TType extends RuntimeEventType = RuntimeEventType> {
  type?: TType | TType[];
  runtime?: RuntimeName | RuntimeName[];
  correlationId?: string;
  causationId?: string;
  context?: Partial<RuntimeContext>;
}

export type RuntimeEventListener<TEvent extends RuntimeEvent = RuntimeEvent> = (
  event: TEvent,
) => void | Promise<void>;

export type RuntimeBusMiddleware<TEvent extends RuntimeEvent = RuntimeEvent> = (
  event: TEvent,
  next: () => Promise<void>,
) => void | Promise<void>;

export interface RuntimeBusSubscription {
  id: string;
}

export interface RuntimeBusMetrics {
  publishedEvents: number;
  deliveredEvents: number;
  subscriberCount: number;
  middlewareCount: number;
  failedSubscribers: number;
  averageDispatchTimeMs: number;
}

export interface RuntimeBusOptions {
  defaultContext?: RuntimeContext;
}

interface RuntimeBusSubscriptionRecord<TEvent extends RuntimeEvent = RuntimeEvent> {
  id: string;
  listener: RuntimeEventListener<TEvent>;
  filter?: RuntimeEventFilter<TEvent["type"]>;
  once: boolean;
}

interface RuntimeBusExecutionContext<TEvent extends RuntimeEvent = RuntimeEvent> {
  event: TEvent;
}

const DEFAULT_CONTEXT: RuntimeContext = {
  institutionId: "unknown",
};

export class RuntimeBus<TEvent extends RuntimeEvent = RuntimeEvent> {
  private readonly history: TEvent[] = [];

  private readonly subscriptions: RuntimeBusSubscriptionRecord<TEvent>[] = [];

  private readonly middleware: RuntimeBusMiddleware<TEvent>[] = [];

  private readonly executionContext = new AsyncLocalStorage<RuntimeBusExecutionContext<TEvent>>();

  private readonly defaultContext: RuntimeContext;

  private publishedEvents = 0;

  private deliveredEvents = 0;

  private failedSubscribers = 0;

  private totalDispatchTimeMs = 0;

  private subscriptionCounter = 0;

  constructor(options: RuntimeBusOptions = {}) {
    this.defaultContext = { ...DEFAULT_CONTEXT, ...(options.defaultContext ?? {}) };
  }

  publish(event: RuntimeEventInput<TEvent["type"], TEvent["payload"]>): TEvent {
    const parentEvent = this.executionContext.getStore()?.event;
    const normalizedEvent = this.normalizeEvent(event, parentEvent);
    const storedEvent = this.cloneEvent(normalizedEvent);

    this.history.push(storedEvent);
    this.publishedEvents += 1;

    queueMicrotask(() => {
      this.executionContext.run({ event: storedEvent }, () => {
        void this.dispatch(this.cloneEvent(storedEvent));
      });
    });

    return storedEvent;
  }

  subscribe(
    listener: RuntimeEventListener<TEvent>,
    filter?: RuntimeEventFilter<TEvent["type"]>,
  ): RuntimeBusSubscription {
    const subscription: RuntimeBusSubscriptionRecord<TEvent> = {
      id: this.nextSubscriptionId(),
      listener,
      filter,
      once: false,
    };
    this.subscriptions.push(subscription);
    return { id: subscription.id };
  }

  once(
    listener: RuntimeEventListener<TEvent>,
    filter?: RuntimeEventFilter<TEvent["type"]>,
  ): RuntimeBusSubscription {
    const subscription: RuntimeBusSubscriptionRecord<TEvent> = {
      id: this.nextSubscriptionId(),
      listener: async (event) => {
        if (this.unsubscribe(subscription.id)) {
          await listener(event);
        }
      },
      filter,
      once: true,
    };
    this.subscriptions.push(subscription);
    return { id: subscription.id };
  }

  use(middleware: RuntimeBusMiddleware<TEvent>): void {
    this.middleware.push(middleware);
  }

  unsubscribe(subscriptionId: string): boolean {
    const index = this.subscriptions.findIndex((subscription) => subscription.id === subscriptionId);
    if (index < 0) {
      return false;
    }
    this.subscriptions.splice(index, 1);
    return true;
  }

  replay(filter?: RuntimeEventFilter<TEvent["type"]>): TEvent[] {
    return this.history.filter((event) => this.matchesFilter(event, filter)).map((event) => this.cloneEvent(event));
  }

  metrics(): RuntimeBusMetrics {
    return {
      publishedEvents: this.publishedEvents,
      deliveredEvents: this.deliveredEvents,
      subscriberCount: this.subscriptions.length,
      middlewareCount: this.middleware.length,
      failedSubscribers: this.failedSubscribers,
      averageDispatchTimeMs: this.deliveredEvents > 0 ? this.totalDispatchTimeMs / this.deliveredEvents : 0,
    };
  }

  clear(): void {
    this.history.length = 0;
    this.subscriptions.length = 0;
    this.middleware.length = 0;
    this.publishedEvents = 0;
    this.deliveredEvents = 0;
    this.failedSubscribers = 0;
    this.totalDispatchTimeMs = 0;
    this.subscriptionCounter = 0;
  }

  count(): number {
    return this.history.length;
  }

  private async dispatch(event: TEvent): Promise<void> {
    const startedAt = performance.now();
    try {
      await this.runMiddleware(0, event);
    } finally {
      this.deliveredEvents += 1;
      this.totalDispatchTimeMs += performance.now() - startedAt;
    }
  }

  private async runMiddleware(index: number, event: TEvent): Promise<void> {
    if (index >= this.middleware.length) {
      await this.deliverToSubscribers(event);
      return;
    }

    const middleware = this.middleware[index];
    await middleware(event, async () => {
      await this.runMiddleware(index + 1, event);
    });
  }

  private async deliverToSubscribers(event: TEvent): Promise<void> {
    const activeSubscriptions = [...this.subscriptions];
    for (const subscription of activeSubscriptions) {
      if (!this.matchesFilter(event, subscription.filter)) {
        continue;
      }

      try {
        await subscription.listener(event);
      } catch {
        this.failedSubscribers += 1;
      }

      if (subscription.once) {
        this.unsubscribe(subscription.id);
      }
    }
  }

  private normalizeEvent(
    event: RuntimeEventInput<TEvent["type"], TEvent["payload"]>,
    parentEvent?: TEvent,
  ): TEvent {
    const inheritedContext = parentEvent?.context;
    const context = this.resolveContext(event.context, inheritedContext);

    return {
      id: event.id,
      type: event.type,
      runtime: event.runtime,
      timestamp: event.timestamp instanceof Date ? new Date(event.timestamp.getTime()) : new Date(event.timestamp),
      correlationId: parentEvent?.correlationId ?? event.correlationId ?? randomUUID(),
      causationId: parentEvent?.id ?? event.causationId,
      version: 1,
      context,
      payload: event.payload,
      ...(event.metadata ? { metadata: { ...event.metadata } } : {}),
    } as TEvent;
  }

  private resolveContext(
    context?: Partial<RuntimeContext>,
    parentContext?: RuntimeContext,
  ): RuntimeContext {
    if (parentContext) {
      return { ...parentContext };
    }

    if (context) {
      return {
        ...this.defaultContext,
        ...context,
        institutionId: context.institutionId ?? this.defaultContext.institutionId ?? DEFAULT_CONTEXT.institutionId,
      };
    }

    return { ...this.defaultContext };
  }

  private matchesFilter(event: RuntimeEvent, filter?: RuntimeEventFilter): boolean {
    if (!filter) {
      return true;
    }

    if (filter.type) {
      const allowedTypes = Array.isArray(filter.type) ? filter.type : [filter.type];
      if (!allowedTypes.includes(event.type)) {
        return false;
      }
    }

    if (filter.runtime) {
      const allowedRuntimes = Array.isArray(filter.runtime) ? filter.runtime : [filter.runtime];
      if (!allowedRuntimes.includes(event.runtime)) {
        return false;
      }
    }

    if (filter.correlationId && event.correlationId !== filter.correlationId) {
      return false;
    }

    if (filter.causationId && event.causationId !== filter.causationId) {
      return false;
    }

    if (filter.context) {
      for (const [key, value] of Object.entries(filter.context)) {
        if (value === undefined) {
          continue;
        }
        if ((event.context as unknown as Record<string, unknown>)[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  private cloneEvent(event: TEvent): TEvent {
    return {
      ...event,
      timestamp: new Date(event.timestamp.getTime()),
      context: { ...event.context },
      ...(event.metadata ? { metadata: { ...event.metadata } } : {}),
    } as TEvent;
  }

  private nextSubscriptionId(): string {
    this.subscriptionCounter += 1;
    return `subscription-${this.subscriptionCounter}`;
  }
}
