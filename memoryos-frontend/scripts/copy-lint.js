#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const TARGET_DIRS = [path.join(ROOT, "components", "landing")];
const TARGET_EXTENSIONS = new Set([".ts", ".tsx", ".md"]);

const BANNED_PATTERNS = [
  { label: "just a memory layer", regex: /\bjust a memory layer\b/i },
  { label: "chat memory tool", regex: /\bchat memory tool\b/i },
  { label: "personal notes for agents", regex: /\bpersonal notes for agents\b/i },
  { label: "storage-first memory", regex: /\bstorage-first memory\b/i },
  { label: "get a personal memoryos", regex: /\bget a personal memoryos\b/i },
];

function walk(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
      continue;
    }
    if (!entry.isFile()) continue;
    if (!TARGET_EXTENSIONS.has(path.extname(entry.name))) continue;
    out.push(full);
  }
  return out;
}

function lintFile(file) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split(/\r?\n/);
  const issues = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    for (const pattern of BANNED_PATTERNS) {
      if (pattern.regex.test(line)) {
        issues.push({
          line: i + 1,
          label: pattern.label,
          text: line.trim(),
        });
      }
    }
  }

  return issues;
}

function main() {
  const files = TARGET_DIRS.flatMap((dir) => walk(dir));
  let issueCount = 0;

  for (const file of files) {
    const issues = lintFile(file);
    if (!issues.length) continue;

    const rel = path.relative(ROOT, file);
    for (const issue of issues) {
      issueCount += 1;
      console.error(`${rel}:${issue.line}  banned-phrase  ${issue.label}`);
      console.error(`  ${issue.text}`);
    }
  }

  if (issueCount > 0) {
    console.error(`\ncopy-lint failed: found ${issueCount} banned phrase(s).`);
    process.exit(1);
  }

  console.log("copy-lint passed: no banned phrases found in landing copy.");
}

main();
