import { epochSqsConfigFromEnv, epochSqsInFlightCount, receiveEpochJobsFromSqs, releaseEpochSqsJob } from "../lib/epoch/awsSqsQueueTransport";

async function main() {
  const config = epochSqsConfigFromEnv();
  if (!config) {
    console.log(JSON.stringify({ version: "epoch_sqs_transport.v1", status: "UNAVAILABLE", reason: "EPOCH_SQS_MISSIONS_URL_or_EPOCH_SQS_RUNTIME_URL_not_configured" }, null, 2));
    process.exitCode = 2;
    return;
  }
  const deliveries = await receiveEpochJobsFromSqs(config);
  for (const delivery of deliveries) {
    await releaseEpochSqsJob(delivery.job.id, config).catch(() => undefined);
  }
  console.log(JSON.stringify({ version: "epoch_sqs_transport.v1", status: "READY", queueUrlConfigured: true, received: deliveries.length, inFlight: epochSqsInFlightCount(), released: deliveries.length, backpressureLimit: config.maxInFlight }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
