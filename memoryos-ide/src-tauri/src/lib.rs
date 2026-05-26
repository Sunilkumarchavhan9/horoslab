use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

const MAX_FILE_BYTES: usize = 2 * 1024 * 1024;

const SKIP_DIR_NAMES: &[&str] = &[
    "node_modules",
    ".git",
    ".next",
    "target",
    "dist",
    "build",
    ".turbo",
    ".cache",
];

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FsEntry {
    name: String,
    path: String,
    #[serde(rename = "type")]
    entry_type: String,
    size: Option<u64>,
}

fn resolve_workspace_path(workspace_root: &str, relative_path: &str) -> Result<PathBuf, String> {
    let root = PathBuf::from(workspace_root);
    if !root.is_absolute() {
        return Err("Workspace root must be absolute.".into());
    }
    let root = fs::canonicalize(&root).map_err(|e| format!("Invalid workspace root: {e}"))?;
    let target = if relative_path.is_empty() {
        root.clone()
    } else {
        root.join(relative_path.replace('/', std::path::MAIN_SEPARATOR_STR))
    };
    let canonical = target
        .canonicalize()
        .map_err(|e| format!("Path not found: {e}"))?;
    if !canonical.starts_with(&root) {
        return Err("Path escapes workspace.".into());
    }
    Ok(canonical)
}

fn relative_path_from_root(root: &Path, full: &Path) -> String {
    full.strip_prefix(root)
        .unwrap_or(full)
        .to_string_lossy()
        .replace('\\', "/")
}

fn should_skip_dir(name: &str) -> bool {
    SKIP_DIR_NAMES.contains(&name) || name.starts_with('.') && name != ".memoryos"
}

#[tauri::command]
fn ide_open_folder() -> Result<String, String> {
    let folder = rfd::FileDialog::new()
        .set_title("Open project folder — MemoryOS IDE")
        .pick_folder()
        .ok_or_else(|| "No folder selected.".to_string())?;
    let canonical = fs::canonicalize(&folder).map_err(|e| format!("Could not open folder: {e}"))?;
    Ok(canonical.to_string_lossy().to_string())
}

#[tauri::command]
fn ide_list_directory(workspace_root: String, relative_path: String) -> Result<Vec<FsEntry>, String> {
    let root = PathBuf::from(&workspace_root);
    let root = fs::canonicalize(&root).map_err(|e| format!("Invalid workspace: {e}"))?;
    let dir = resolve_workspace_path(workspace_root.as_str(), relative_path.as_str())?;
    if !dir.is_dir() {
        return Err("Not a directory.".into());
    }

    let mut entries: Vec<FsEntry> = fs::read_dir(&dir)
        .map_err(|e| format!("Read dir failed: {e}"))?
        .filter_map(|e| e.ok())
        .filter_map(|entry| {
            let name = entry.file_name().to_string_lossy().to_string();
            let path = entry.path();
            if path.is_dir() && should_skip_dir(&name) {
                return None;
            }
            let rel = relative_path_from_root(&root, &path);
            let entry_type = if path.is_dir() { "dir" } else { "file" };
            let size = if path.is_file() {
                path.metadata().ok().map(|m| m.len())
            } else {
                None
            };
            Some(FsEntry {
                name,
                path: rel,
                entry_type: entry_type.to_string(),
                size,
            })
        })
        .collect();

    entries.sort_by(|a, b| {
        if a.entry_type != b.entry_type {
            return if a.entry_type == "dir" { std::cmp::Ordering::Less } else { std::cmp::Ordering::Greater };
        }
        a.name.to_lowercase().cmp(&b.name.to_lowercase())
    });

    Ok(entries)
}

#[tauri::command]
fn ide_read_file(workspace_root: String, relative_path: String) -> Result<String, String> {
    let file_path = resolve_workspace_path(&workspace_root, &relative_path)?;
    if !file_path.is_file() {
        return Err("Not a file.".into());
    }
    let meta = file_path.metadata().map_err(|e| e.to_string())?;
    if meta.len() as usize > MAX_FILE_BYTES {
        return Err(format!(
            "File too large for editor ({} bytes, max {}).",
            meta.len(),
            MAX_FILE_BYTES
        ));
    }
    fs::read_to_string(&file_path).map_err(|e| format!("Read failed: {e}"))
}

#[tauri::command]
fn ide_write_file(workspace_root: String, relative_path: String, content: String) -> Result<(), String> {
    let file_path = resolve_workspace_path(&workspace_root, &relative_path)?;
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Create parent dirs failed: {e}"))?;
    }
    fs::write(&file_path, content.as_bytes()).map_err(|e| format!("Write failed: {e}"))
}

#[tauri::command]
fn ide_get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            ide_open_folder,
            ide_list_directory,
            ide_read_file,
            ide_write_file,
            ide_get_version,
        ])
        .run(tauri::generate_context!())
        .expect("error while running MemoryOS IDE");
}
