import { inspectEpochAwsControlPlane } from "../lib/epoch/awsControlPlaneContract";

const result = inspectEpochAwsControlPlane();
console.log(JSON.stringify(result, null, 2));
if (result.status === "INVALID") process.exitCode = 2;

