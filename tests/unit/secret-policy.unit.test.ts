import { describe, expect, it } from "vitest";
import { redactSensitiveObject, redactSensitiveText } from "../../server/services/secret-policy";

describe("secret policy", () => {
  it("redacts multiline pasted secrets consistently", () => {
    const input = [
      "export TOKEN=supersecret",
      "Authorization: Bearer ghp_supersecrettoken123456789",
      "curl --password=letmein --api-key=abc123",
      "AWS_ACCESS_KEY_ID=AKIA1234567890ABCDEF",
    ].join("\n");

    const redacted = redactSensitiveText(input);

    expect(redacted).not.toContain("supersecret");
    expect(redacted).not.toContain("ghp_supersecrettoken123456789");
    expect(redacted).not.toContain("letmein");
    expect(redacted).not.toContain("AKIA1234567890ABCDEF");
    expect(redacted).toContain("[REDACTED]");
    expect(redacted).toContain("TOKEN=[REDACTED]");
    expect(redacted).toContain("Bearer [REDACTED]");
  });

  it("redacts sensitive keys inside nested objects", () => {
    const payload = {
      title: "export TOKEN=supersecret",
      nested: {
        password: "plaintext",
        safe: "hello",
      },
    };

    const redacted = redactSensitiveObject(payload);

    expect(redacted.title).toContain("[REDACTED]");
    expect(redacted.nested.password).toBe("[REDACTED]");
    expect(redacted.nested.safe).toBe("hello");
  });
});
