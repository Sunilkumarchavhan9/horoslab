/**
 * Bridge to MemoryOS IDE (Tauri desktop shell).
 * In the browser these calls no-op or return null.
 */

export type LocalFsEntry = {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
};

export function isMemoryOsDesktop(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as Window & { __TAURI_INTERNALS__?: unknown; __TAURI__?: unknown };
  return Boolean(w.__TAURI_INTERNALS__ ?? w.__TAURI__);
}

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const mod = (await import("@tauri-apps/api/core")) as {
    invoke: (cmd: string, args?: Record<string, unknown>) => Promise<T>;
  };
  return mod.invoke(cmd, args);
}

export async function desktopOpenFolder(): Promise<string | null> {
  if (!isMemoryOsDesktop()) return null;
  try {
    return await invoke<string>("ide_open_folder");
  } catch {
    return null;
  }
}

export async function desktopListDirectory(
  workspaceRoot: string,
  relativePath: string,
): Promise<LocalFsEntry[]> {
  if (!isMemoryOsDesktop()) return [];
  const rows = await invoke<
    Array<{ name: string; path: string; type: string; size?: number }>
  >("ide_list_directory", { workspaceRoot, relativePath });
  return rows.map((r) => ({
    name: r.name,
    path: r.path,
    type: r.type === "dir" ? "dir" : "file",
    size: r.size,
  }));
}

export async function desktopReadFile(
  workspaceRoot: string,
  relativePath: string,
): Promise<string> {
  return invoke<string>("ide_read_file", { workspaceRoot, relativePath });
}

export async function desktopWriteFile(
  workspaceRoot: string,
  relativePath: string,
  content: string,
): Promise<void> {
  await invoke("ide_write_file", { workspaceRoot, relativePath, content });
}

export async function desktopIdeVersion(): Promise<string | null> {
  if (!isMemoryOsDesktop()) return null;
  try {
    return await invoke<string>("ide_get_version");
  } catch {
    return null;
  }
}
