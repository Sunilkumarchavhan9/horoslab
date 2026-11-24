---
name: Git Push on Completion
description: Instructions to automatically commit and push changes to the main repository (epoch) whenever work is done.
---

# Always Commit & Push Changes on Every Task Completion

Whenever you complete ANY task or work requested by the user:

1. **Commit your changes**:
   - Stage the modified files: `git add <files>`
   - Create a clear, concise commit message following conventional commits (e.g., `fix(robotics): adjust text sizing and padding for sandbox UI`).

2. **Push only the repository that owns this work**:
   - Decide from the files that changed. Do not push the same work to both remotes.
   - HOROS PROBE-1 research (`Research-002/`, `research/PROBE-1/`) goes only to `https://github.com/Sunilkumarchavhan9/horos-probe-1` (`probe1` / the `horos-probe-1` checkout).
   - MemoryOS product, frontend, and agent-rule changes go only to `https://github.com/Sunilkumarchavhan9/horoslab` (`origin` in this workspace).
   - Push the current feature branch. Do not push that branch onto `main` unless the user asked to update `main`.
   - If the user asks for a PR, push the feature branch and return the PR URL.

3. **Mandatory Rule**:
   - Never end a completed request without committing and pushing the work to the one repository it belongs to.
