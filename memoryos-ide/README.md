# MemoryOS IDE (desktop)

Tauri shell for the Continuity Lab workbench. The IDE loads the web UI and adds **local folder** open/read/write via Rust.

## Prerequisites

### 1. Rust (required — fixes `cargo: program not found`)

Tauri needs **Cargo**. On Windows, install once:

**Option A — winget (recommended):**
```powershell
winget install Rustlang.Rustup --accept-package-agreements --accept-source-agreements
```

**Option B — official installer:**  
Download and run [rustup-init.exe](https://win.rustup.rs/x86_64), choose default install, then **close and reopen PowerShell**.

Verify:
```powershell
cargo --version
rustc --version
```

You also need **Visual Studio Build Tools** with the **C++** workload. Without it, the first compile fails with:

```text
error: linker `link.exe` not found
```

**Install (pick one):**

```powershell
# From memoryos-ide (may prompt for admin; ~15–30 min download)
.\scripts\setup-windows-msvc.ps1
```

```powershell
# Or winget directly
winget install Microsoft.VisualStudio.2022.BuildTools --accept-package-agreements --accept-source-agreements --override "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

Or use the GUI installer: [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) → check **Desktop development with C++**.

After install, **close all terminals** (or reboot), then run `npm run dev` again. Verify with:

```powershell
where.exe link.exe
```

If `cargo --version` works in a **new** terminal but `npm run dev` still says `program not found`, either close Cursor/terminals and reopen, or run once in that session:

```powershell
$env:Path = "$env:USERPROFILE\.cargo\bin;" + $env:Path
```

`npm run dev` also prepends `%USERPROFILE%\.cargo\bin` automatically via `scripts/tauri-with-path.cjs`.

### 2. Other

- Node.js 22.x
- MemoryOS backend + frontend running (for API / Company Brain)

## Development

1. Start the API and web app (from repo root):

```bash
# Terminal 1 — backend
cd memoryos-frontend
npm run dev:all
```

2. Start the desktop IDE:

```bash
cd memoryos-ide
npm install
npm run dev
```

The window opens `http://localhost:3000/developer-console/continuity-lab?layout=editor&desktop=1` by default.

Override the URL:

```powershell
$env:MEMORYOS_WEB_URL="http://localhost:3000"
npm run dev
```

## Production build

```bash
npm run build
```

Set `MEMORYOS_WEB_URL` to your hosted Continuity Lab URL before building, or ship a configured `tauri.conf.json` `frontendDist` once static export is wired.

## Local workspace

In Editor mode, use **Open folder** to browse files on disk. Edits save with **Save to disk** in the Review panel (local mode). GitHub propose/approve still works when GitHub is connected.
