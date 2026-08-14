import assert from "node:assert/strict";
import test from "node:test";
import {
  buildContinuityLoopProgress,
  defaultCompanyBrainFunnelProgress,
  meetsSyncGithubThreshold,
  mergeContractCountDeltas,
  sanitizeContractCounts,
  summarizeFunnelIngestion,
} from "../lib/companyBrain/funnelStore";

test("sanitizeContractCounts keeps valid taxonomy keys only", () => {
  const counts = sanitizeContractCounts({
    decision: 2,
    bogus: 5,
    runbook: 0,
  });
  assert.deepEqual(counts, { decision: 2 });
});

test("mergeContractCountDeltas accumulates per category", () => {
  const merged = mergeContractCountDeltas({ decision: 1 }, { decision: 2, incident: 1 });
  assert.deepEqual(merged, { decision: 3, incident: 1 });
});

test("meetsSyncGithubThreshold requires structured contract memories", () => {
  const empty = defaultCompanyBrainFunnelProgress("user_test");
  assert.equal(meetsSyncGithubThreshold(empty), false);

  const withContracts = {
    ...empty,
    contractCountsByCategory: { decision: 1 },
  };
  assert.equal(meetsSyncGithubThreshold(withContracts), true);
  assert.equal(summarizeFunnelIngestion(withContracts).totalContractMemories, 1);
});

test("buildContinuityLoopProgress maps funnel flags for the 8-step loop", () => {
  const progress = {
    ...defaultCompanyBrainFunnelProgress("user_loop"),
    briefLoaded: true,
    labOpened: true,
    proposalCreated: true,
    proposalApproved: true,
    executed: true,
    resumed: false,
    lastProject: "payments-api",
  };
  assert.deepEqual(buildContinuityLoopProgress(progress), {
    briefGenerated: true,
    labOpened: true,
    proposalCreated: true,
    approved: true,
    executed: true,
    resumed: false,
    lastProject: "payments-api",
  });
});
