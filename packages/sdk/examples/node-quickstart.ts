import { createMemoryOSClient } from "@memoryostm/sdk";

const memory = createMemoryOSClient({
  apiKey: process.env.MEMORYOS_API_KEY!,
  baseUrl: process.env.MEMORYOS_BASE_URL ?? "http://localhost:3001",
});

const threadId = "week2-sdk-quickstart";
const project = "MemoryOS";

async function main() {
  await memory.afterModel({
    threadId,
    message: "We fixed auth flow, backend tests, and SDK onboarding gaps.",
    modelResponse: "Next step is onboarding three design partners with the SDK quickstart.",
  });

  const before = await memory.beforeModel({
    mode: "resume",
    project,
    threadId,
    question: "Where did I leave off on MemoryOS?",
    topK: 5,
  });

  console.log("\nContext to inject before model:\n");
  console.log(before.contextText || "(No context returned yet)");

  const resume = await memory.resume({
    project,
    threadId,
    question: "What should I do next?",
    topK: 5,
  });

  console.log("\nResume summary:\n");
  console.log(resume.summary);

  const handoff = await memory.handoff({
    project,
    threadId,
    question: "Create a handoff for the next developer.",
    topK: 5,
  });

  console.log("\nHandoff summary:\n");
  console.log(handoff.summary);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
