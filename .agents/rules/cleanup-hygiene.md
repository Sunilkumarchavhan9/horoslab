---
name: Cleanup Hygiene
description: Instructions for keeping the repository and local codebase free of temporary and corrupted files.
---

# Codebase Cleanup Hygiene

Whenever you are working in this workspace, you MUST adhere to the following rules regarding temporary, scratch, or corrupted files:

1. **Proactive Deletion**: If you create temporary scripts (e.g., `.js` scripts to modify files, `temp.tsx`, or PowerShell scripts like `push_clean.ps1`) to accomplish a task, you MUST automatically delete them from the local codebase as soon as you are done using them. Do not leave them lingering for the user to find.
2. **Never Commit Garbage**: Never commit temporary scripts, scratch directories, or corrupted Next.js backups (like `.next-corrupt-backup-*`) to the Git repository. 
3. **Daily Cleanup**: Constantly scan your working directory when pushing or committing code to ensure no unwanted files (`scratch/` folders, `temp` files, `.bak` files) are being tracked. If you find them, delete them both locally and from the repository immediately.
4. **No Permission Needed**: The user has explicitly authorized you to delete these types of junk files automatically without asking for permission. Just do it and inform the user that you've kept the codebase clean.
