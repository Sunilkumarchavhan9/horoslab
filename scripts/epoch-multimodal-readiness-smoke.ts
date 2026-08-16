import { inspectEpochMultimodalConnectors } from "../lib/epoch/multimodalConnectorReadiness";

const report = inspectEpochMultimodalConnectors();
console.log(JSON.stringify(report, null, 2));
if (report.unavailableCount > 0) process.exitCode = 2;
