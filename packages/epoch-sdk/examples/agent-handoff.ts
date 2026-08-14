import { createEpochClient } from "@epochtm/sdk";

const epoch = createEpochClient({
  apiKey: process.env.EPOCH_API_KEY!,
  baseUrl: process.env.EPOCH_BASE_URL ?? "http://localhost:3001",
});

async function main() {
  const project = "MemoryOS";
  const threadId = "week2-agent-handoff";

  await epoch.afterModel({
    threadId,
    message: "Agent A finished backend safety fixes and needs Agent B to continue SDK onboarding.",
    modelResponse: "Agent B should run the SDK quickstart and verify Mission Control shows the new memory.",
  });

  const handoff = await epoch.handoff({
    project,
    threadId,
    question: "Prepare a concise handoff for the next coding agent.",
    topK: 5,
  });

  console.log("Current state:\n", handoff.currentState);
  console.log("\nOpen loops:\n", handoff.openLoops);
  console.log("\nRecommended next actions:\n", handoff.recommendedNextActions);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
