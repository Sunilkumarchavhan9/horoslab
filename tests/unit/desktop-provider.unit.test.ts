import { beforeEach, describe, expect, it } from "vitest";
import {
  createContinuityThread,
  createThreadArtifact,
  getContinuityThread,
} from "../../lib/continuity/continuityThreadStore";
import { publishDesktopWorkerState } from "../../lib/continuity/desktopProvider";
import { resetRuntimeDataStores } from "../helpers/resetDataDir";

describe("desktop provider worker sync", () => {
  const userId = "u_desktop_provider";

  beforeEach(() => {
    resetRuntimeDataStores();
  });

  it("publishes claimed -> completed -> blocked -> failed desktop session transitions", async () => {
    const thread = await createContinuityThread({
      userId,
      title: "Desktop flow test",
      workspace: "default",
      project: "memoryos",
    });

    await createThreadArtifact(userId, thread.id, {
      type: "preview",
      producer: "verifier",
      title: "Desktop preview",
      content: "https://preview.memoryos.dev/session-1",
      tags: ["desktop_preview", "provider:vscode"],
      sourceProvider: "vscode",
    });

    await publishDesktopWorkerState({
      userId,
      threadId: thread.id,
      workerJobId: "job-claimed-1",
      phase: "claimed",
      note: "Worker claimed execution.",
    });

    let current = await getContinuityThread(userId, thread.id);
    expect(current?.desktopSession?.state).toBe("live");
    expect(current?.desktopSession?.providerSessionId).toBe("job-claimed-1");

    await publishDesktopWorkerState({
      userId,
      threadId: thread.id,
      workerJobId: "job-complete-1",
      phase: "completed",
      note: "Worker completed successfully.",
    });

    current = await getContinuityThread(userId, thread.id);
    expect(current?.desktopSession?.state).toBe("live");
    expect(current?.desktopSession?.provider).toBe("vscode");
    expect(current?.desktopSession?.previewUrl).toBe("https://preview.memoryos.dev/session-1");
    expect(current?.desktopSession?.controlUrl).toBe("https://preview.memoryos.dev/session-1");

    await publishDesktopWorkerState({
      userId,
      threadId: thread.id,
      workerJobId: "job-blocked-1",
      phase: "blocked",
      note: "Awaiting reviewer decision.",
    });

    current = await getContinuityThread(userId, thread.id);
    expect(current?.desktopSession?.state).toBe("blocked");
    expect(current?.desktopSession?.runtimeMessage).toContain("Awaiting reviewer decision");

    await publishDesktopWorkerState({
      userId,
      threadId: thread.id,
      workerJobId: "job-failed-1",
      phase: "failed",
      error: "Desktop control channel failed.",
    });

    current = await getContinuityThread(userId, thread.id);
    expect(current?.desktopSession?.state).toBe("error");
    expect(current?.desktopSession?.runtimeMessage).toContain("Desktop control channel failed");
  });
});
