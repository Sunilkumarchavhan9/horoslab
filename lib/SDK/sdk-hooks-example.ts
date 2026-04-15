import { afterModel, beforeModel } from "./index";

async function fakeModelCall(prompt: string): Promise<string> {
  void prompt;

  // Replace this with your real model call later.
  return "You should finish the handoff workflow tests next.";
}

export async function runSdkHooksExample(): Promise<void> {
  const userId = "u_example";
  const project = "memoryos";
  const threadId = "thread-1";
  const question = "What should I work on next for MemoryOS?";

  const before = await beforeModel({
    userId,
    question,
    project,
    threadId,
    mode: "retrieve",
    topK: 5,
  });

  const prompt = [
    "You are helping with the next step in the project.",
    "",
    "Relevant context:",
    before.contextText || "No saved context.",
    "",
    `User question: ${question}`,
  ].join("\n");

  const modelResponse = await fakeModelCall(prompt);

  await afterModel({
    userId,
    threadId,
    message: question,
    modelResponse,
  });

  console.log("Prompt sent to model:\n", prompt);
  console.log("Model response:\n", modelResponse);
}

void runSdkHooksExample();
