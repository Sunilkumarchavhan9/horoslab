import { existsSync, mkdirSync, readFileSync, rmSync } from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  sanitizeEngineeringSignalUploadFilename,
  writeEngineeringSignalExportUpload,
} from "../lib/integrations/engineeringSignalUpload";

describe("engineering signal export upload", () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = path.join(os.tmpdir(), `memoryos-export-upload-${Date.now()}-${Math.random()}`);
    mkdirSync(tempRoot, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("sanitizes uploaded filenames and keeps supported extensions", () => {
    expect(sanitizeEngineeringSignalUploadFilename("../Cursor Session!.md")).toBe("Cursor-Session.md");
    expect(sanitizeEngineeringSignalUploadFilename("chat-export.exe")).toBe("chat-export.txt");
  });

  it("writes uploaded exports into the target root with a unique relative path", () => {
    const result = writeEngineeringSignalExportUpload({
      type: "codex_chats",
      rootPath: tempRoot,
      filename: "handoff.md",
      content: "Codex handoff: run phase1 gate before shipping.",
      uploadedAt: "2026-06-19T00:00:00.000Z",
    });

    expect(result.rootPath).toBe(path.resolve(tempRoot));
    expect(result.relativePath).toMatch(/^2026-06-19-[a-f0-9]{8}-handoff\.md$/);
    expect(existsSync(result.absolutePath)).toBe(true);
    expect(readFileSync(result.absolutePath, "utf8")).toContain("Codex handoff");
  });

  it("rejects empty uploads", () => {
    expect(() =>
      writeEngineeringSignalExportUpload({
        type: "cursor_chats",
        rootPath: tempRoot,
        filename: "empty.md",
        content: "",
      }),
    ).toThrow("empty");
  });
});
