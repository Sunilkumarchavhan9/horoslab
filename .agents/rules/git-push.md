---
name: Git Push on Completion
description: Instructions to automatically commit and push changes to the main repository (epoch) whenever work is done.
---

# Always Push Changes to Main Repo

Whenever you complete changes or finish any work requested by the user:

1. **Commit your changes**: Create a clear, concise commit message following conventional commits (e.g., `style(multimodal-ai): constrain sandbox UI width to grid columns`).
2. **Push to the main repository**: Always push commits to the `epoch` remote (`https://github.com/Sunilkumarchavhan9/epoch.git`), specifically to branch `main`:
   ```bash
   git push epoch main
   ```
3. **Keep code clean**: Ensure only the intended project changes are staged and committed, respecting cleanup hygiene rules.
