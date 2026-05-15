import tracer from "dd-trace";

const datadogEnabled =
  process.env.DD_TRACE_ENABLED !== "false" &&
  (process.env.NODE_ENV === "production" || process.env.DD_ENV === "production");

if (datadogEnabled) {
  const agentUrl =
    process.env.DD_TRACE_AGENT_URL ||
    `${process.env.DD_AGENT_HOST || "127.0.0.1"}:${process.env.DD_TRACE_AGENT_PORT || "8126"}`;
  tracer.init({
    env: process.env.DD_ENV || process.env.NODE_ENV,
    service: process.env.DD_SERVICE || "memoryos-backend",
    version: process.env.DD_VERSION || process.env.SENTRY_RELEASE,
    logInjection: true,
    runtimeMetrics: true,
    profiling: process.env.DD_PROFILING_ENABLED === "true",
  });
  console.log(`[Datadog] tracing enabled service=${process.env.DD_SERVICE || "memoryos-backend"} env=${process.env.DD_ENV || process.env.NODE_ENV} agent=${agentUrl}`);
} else {
  console.log("[Datadog] tracing disabled (check DD_TRACE_ENABLED/DD_ENV/NODE_ENV)");
}
