import { createEpochClient } from "@epochtm/sdk";

const epoch = createEpochClient({
  apiKey: process.env.EPOCH_API_KEY!,
  baseUrl: process.env.EPOCH_BASE_URL ?? "http://localhost:3001",
});

const threadId = "week2-sdk-quickstart";
const project = "MemoryOS";

async function main() {
  await epoch.afterModel({
    threadId,
    message: "We fixed auth flow, backend tests, and SDK onboarding gaps.",
    modelResponse: "Next step is onboarding three design partners with the SDK quickstart.",
  });

  const before = await epoch.beforeModel({
    mode: "resume",
    project,
    threadId,
    question: "Where did I leave off on MemoryOS?",
    topK: 5,
  });

  console.log("\nContext to inject before model:\n");
  console.log(before.contextText || "(No context returned yet)");

  const resume = await epoch.resume({
    project,
    threadId,
    question: "What should I do next?",
    topK: 5,
  });

  console.log("\nResume summary:\n");
  console.log(resume.summary);

  const handoff = await epoch.handoff({
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
