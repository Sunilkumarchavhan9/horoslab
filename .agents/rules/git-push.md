---
name: Git Push on Completion
description: Instructions to automatically commit and push changes to the main repository (epoch) whenever work is done.
---

# Always Commit & Push Changes on Every Task Completion

Whenever you complete ANY task or work requested by the user:

1. **Commit your changes**:
   - Stage the modified files: `git add <files>`
   - Create a clear, concise commit message following conventional commits (e.g., `fix(robotics): adjust text sizing and padding for sandbox UI`).

2. **Push immediately to the repository**:
   - Push to `origin main` / `epoch main` (`https://github.com/Sunilkumarchavhan9/epoch.git`):
     ```bash
     git push origin main
     ```
   - If user asks for a PR or specific branch, push to the branch and provide the PR URL.

3. **Mandatory Rule**:
   - Never end the response or complete a request without committing and pushing the changes to `https://github.com/Sunilkumarchavhan9/epoch.git`.
