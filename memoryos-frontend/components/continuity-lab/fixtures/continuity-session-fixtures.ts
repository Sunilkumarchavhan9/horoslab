import type { FileChangeEntry, WorklogEntry, ShellLineEntry } from "@/lib/continuity-lab/chat-events";

export const sampleFileChanges: FileChangeEntry[] = [
  {
    id: "sample-1",
    path: "app/api/feedback/route.ts",
    kind: "edit",
    detail: "feedback email fix",
    content: `*** Begin Patch
*** Update File: app/api/feedback/route.ts
@@
-    try {
-      await sendEmail(email);
-      console.log("Email sent successfully to:", email);
-    } catch (emailError: any) {
-      console.error("X Email error:", emailError.message);
-      throw emailError;
-    }
+    try {
+      await sendEmail(email);
+      console.log("Email sent successfully to:", email);
+    } catch (emailError) {
+      // Log email errors but do not fail the signup
+      console.error("Email error:", emailError instanceof Error ? emailError.message : String(emailError));
+    }
`,
  },
  {
    id: "sample-2",
    path: "app/component/AnimatedSVG.tsx",
    kind: "edit",
    detail: "rules-of-hooks",
    content: `*** Begin Patch
*** Update File: app/component/AnimatedSVG.tsx
@@
-  items.map((it) => {
-    const x = useTransform(scrollY, ...);
-    return <g key={it.id}>{/* ... */}</g>;
-  })
+  function AnimatedItem({it}) {
+    const x = useTransform(scrollY, ...);
+    return <g key={it.id}>{/* ... */}</g>;
+  }
+  items.map((it) => <AnimatedItem key={it.id} it={it} />)
`,
  },
  {
    id: "sample-3",
    path: "terminal",
    kind: "command",
    detail: "git push origin devin/1781086722-fix-lint-and-feedback-bug",
    content:
      "Enumerating objects: 23, done. Compressing objects: 100% (10/10), done. Writing objects: 100% (12/12), 1.84 KiB | 1.84 MiB/s, done. Total 12 (delta 8), reused 0 (delta 0), pack-reused 0. To https://github.com/.../20.Poly.git\\n * [new branch]      devin/1781086722-fix-lint-and-feedback-bug -> devin/1781086722-fix-lint-and-feedback-bug",
  },
];

export const sampleWorklog: WorklogEntry[] = [
  { id: "w1", label: "Worked for 22s", detail: "+40 -24", timestamp: new Date().toISOString() },
  { id: "w2", label: "Thought for 5s", timestamp: new Date().toISOString() },
  { id: "w3", label: "Stopped working", timestamp: new Date().toISOString() },
];

export const sampleShellLines: ShellLineEntry[] = [
  {
    id: "s1",
    command: "cd /home/ubuntu/repos/20.Poly && git push origin devin/1781086722-fix-lint-and-feedback-bug",
    output: "Enumerating objects: 23, done.\nWriting objects: 100% (12/12), done.\n[new branch] devin/1781086722-fix-lint-and-feedback-bug -> devin/1781086722-fix-lint-and-feedback-bug",
    timestamp: new Date().toISOString(),
  },
  {
    id: "s2",
    command: "npm run lint",
    output: "All files passed lint.",
    timestamp: new Date().toISOString(),
  },
  {
    id: "s3",
    command: "npm run build",
    output: "Build completed successfully.",
    timestamp: new Date().toISOString(),
  },
];
