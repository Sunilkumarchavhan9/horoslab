import { createMemoryOSClient } from "@memoryostm/sdk";

const memory = createMemoryOSClient({
  apiKey: process.env.MEMORYOS_API_KEY!,
  baseUrl: process.env.MEMORYOS_BASE_URL ?? "http://localhost:3001",
});

async function main() {
  const project = "MemoryOS";
  const threadId = "week2-agent-handoff";

  await memory.afterModel({
    threadId,
    message: "Agent A finished backend safety fixes and needs Agent B to continue SDK onboarding.",
    modelResponse: "Agent B should run the SDK quickstart and verify the developer console shows the new memory.",
  });

  const handoff = await memory.handoff({
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
