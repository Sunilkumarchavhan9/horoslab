/**
 * Prepends ~/.cargo/bin to PATH so `tauri` can run `cargo metadata`
 * when Rust was installed but the shell never picked up PATH (common on Windows).
 */
const { spawnSync, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const pathKey = process.platform === "win32" ? "Path" : "PATH";
const sep = path.delimiter;

function prependPath(dir) {
  if (!dir) return;
  const existing = process.env[pathKey] || "";
  const norm = path.normalize(dir);
  if (existing.split(sep).some((p) => path.normalize(p) === norm)) return;
  process.env[pathKey] = `${norm}${sep}${existing}`;
}

prependPath(path.join(os.homedir(), ".cargo", "bin"));

/** MSVC link.exe — required for Rust on Windows (msvc toolchain). */
function findMsvcBin() {
  if (process.platform !== "win32") return null;
  const pf86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  const vswhere = path.join(pf86, "Microsoft Visual Studio", "Installer", "vswhere.exe");
  if (fs.existsSync(vswhere)) {
    for (const requires of [
      "-requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
      "",
    ]) {
      try {
        const cl = execSync(
          `"${vswhere}" -latest -products * ${requires} -find VC/Tools/MSVC/*/bin/Hostx64/x64/cl.exe`.trim(),
          { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }
        )
          .trim()
          .split(/\r?\n/)
          .find(Boolean);
        if (cl) return path.dirname(cl);
      } catch {
        // try next query
      }
    }
  }
  const roots = [
    path.join(pf86, "Microsoft Visual Studio", "2022", "BuildTools"),
    path.join(pf86, "Microsoft Visual Studio", "2022", "Community"),
    path.join(pf86, "Microsoft Visual Studio", "2022", "Professional"),
    path.join(pf86, "Microsoft Visual Studio", "2019", "BuildTools"),
  ];
  for (const root of roots) {
    const msvcRoot = path.join(root, "VC", "Tools", "MSVC");
    if (!fs.existsSync(msvcRoot)) continue;
    const versions = fs.readdirSync(msvcRoot).sort().reverse();
    for (const ver of versions) {
      const bin = path.join(msvcRoot, ver, "bin", "Hostx64", "x64");
      if (fs.existsSync(path.join(bin, "link.exe"))) return bin;
    }
  }
  return null;
}

function warnMissingMsvc() {
  console.error("");
  console.error("error: MSVC linker (link.exe) not found.");
  console.error("Install Visual Studio 2022 Build Tools with the C++ workload:");
  console.error("  .\\scripts\\setup-windows-msvc.ps1");
  console.error("Or: https://visualstudio.microsoft.com/visual-cpp-build-tools/");
  console.error("");
}

const msvcBin = findMsvcBin();
if (msvcBin) {
  prependPath(msvcBin);
} else if (process.platform === "win32" && process.argv.includes("dev")) {
  warnMissingMsvc();
}

const tauriArgs = process.argv.slice(2);
const projectRoot = path.join(__dirname, "..");
const result = spawnSync("npx", ["tauri", ...tauriArgs], {
  cwd: projectRoot,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status === null ? 1 : result.status);
