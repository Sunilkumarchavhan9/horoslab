from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

PROJECT_NAME = "HOROS_I06_Experiment_03E_v0.1"
EXPECTED = {
    "attrs": "c8bb9bfaa2843e7844b5bb13bed4370b51feec4f",
    "requests": "3c7baaa05ab4aa49cc819ce3a819d260de19c157",
    "rich": "9d8f9a372cc5916fd4781fec207ced7ddac2f08f",
    "werkzeug": "2adaad1ab68312fa46efb07ff072b15b720e2444",
}


def locate_workspace() -> Path:
    candidates = [
        Path.home() / "Downloads" / PROJECT_NAME / "workspace",
        Path.cwd() / PROJECT_NAME / "workspace",
        Path.cwd() / "workspace",
    ]
    for p in candidates:
        if (p / "repos").is_dir():
            return p
    raise FileNotFoundError(
        "Could not locate Downloads/HOROS_I06_Experiment_03E_v0.1/workspace/repos"
    )


WORKSPACE = locate_workspace()
REPOS = WORKSPACE / "repos"
OUT = WORKSPACE / "baseline_qualification" / "recovery_v1"
OUT.mkdir(parents=True, exist_ok=True)
RESULTS: dict[str, Any] = {
    "created_at_utc": datetime.now(timezone.utc).isoformat(),
    "python": sys.version,
    "workspace": str(WORKSPACE),
    "notice": (
        "Recovery attempts are recorded separately from the original baseline runs. "
        "Rich uses a copied source tree with a regenerated lockfile and is not a native-lock baseline."
    ),
    "repositories": {},
}


def run(
    label: str,
    cwd: Path,
    cmd: list[str],
    *,
    timeout: int = 900,
    env: dict[str, str] | None = None,
) -> dict[str, Any]:
    log = OUT / f"{label}.log"
    started = datetime.now(timezone.utc).isoformat()
    t0 = time.time()
    record: dict[str, Any] = {
        "command": cmd,
        "cwd": str(cwd),
        "started_at_utc": started,
        "log": str(log),
    }
    print(f"\n[{label}]", flush=True)
    print(subprocess.list2cmdline(cmd), flush=True)
    try:
        cp = subprocess.run(
            cmd,
            cwd=str(cwd),
            env=env,
            capture_output=True,
            text=True,
            errors="replace",
            timeout=timeout,
        )
        payload = (
            f"COMMAND: {subprocess.list2cmdline(cmd)}\n"
            f"CWD: {cwd}\nSTARTED_UTC: {started}\n"
            f"EXIT_CODE: {cp.returncode}\n\nSTDOUT:\n{cp.stdout}\nSTDERR:\n{cp.stderr}"
        )
        log.write_text(payload, encoding="utf-8")
        record.update(
            status="PASS" if cp.returncode == 0 else "FAIL",
            exit_code=cp.returncode,
            duration_seconds=round(time.time() - t0, 2),
            stdout_tail=cp.stdout[-2500:],
            stderr_tail=cp.stderr[-2500:],
        )
        print(f"EXIT {cp.returncode} | {round(time.time()-t0, 1)} sec", flush=True)
        if cp.stdout:
            print(cp.stdout[-1200:], flush=True)
        if cp.stderr:
            print(cp.stderr[-1200:], flush=True)
    except subprocess.TimeoutExpired as exc:
        out = exc.stdout or ""
        err = exc.stderr or ""
        if isinstance(out, bytes): out = out.decode(errors="replace")
        if isinstance(err, bytes): err = err.decode(errors="replace")
        log.write_text(
            f"COMMAND: {cmd}\nCWD: {cwd}\nTIMEOUT after {timeout}s\nSTDOUT:\n{out}\nSTDERR:\n{err}",
            encoding="utf-8",
        )
        record.update(status="TIMEOUT", exit_code=None, duration_seconds=round(time.time()-t0, 2))
        print(f"TIMEOUT after {timeout}s", flush=True)
    except Exception as exc:
        log.write_text(f"COMMAND: {cmd}\nCWD: {cwd}\nERROR: {exc!r}", encoding="utf-8")
        record.update(status="ERROR", exit_code=None, error=repr(exc), duration_seconds=round(time.time()-t0, 2))
        print(f"ERROR: {exc!r}", flush=True)
    return record


def git(repo: Path, *args: str) -> str:
    cp = subprocess.run(["git", *args], cwd=str(repo), capture_output=True, text=True)
    if cp.returncode != 0:
        raise RuntimeError(cp.stderr.strip() or f"git {' '.join(args)} failed")
    return cp.stdout.strip()


def clean_status(repo: Path) -> str:
    return git(repo, "status", "--porcelain")


def run_pair(repo_name: str, env_name: str, *, force_first: bool) -> dict[str, Any]:
    repo = REPOS / repo_name
    expected = EXPECTED[repo_name]
    current = git(repo, "rev-parse", "HEAD")
    if current != expected:
        return {"status": "PIN_MISMATCH", "expected_commit": expected, "actual_commit": current}
    dirty = clean_status(repo)
    if dirty:
        return {"status": "PREFLIGHT_BLOCKED", "reason": dirty}

    first_args = [sys.executable, "-m", "tox"]
    if force_first:
        first_args.append("-r")
    first_args += ["-e", env_name]
    second_args = [sys.executable, "-m", "tox", "-e", env_name]

    first = run(f"{repo_name}_recovery_run1", repo, first_args)
    after1 = clean_status(repo)
    first["working_tree_clean_after"] = not bool(after1)
    if first.get("status") != "PASS" or after1:
        return {"status": "RUN1_NOT_QUALIFIED", "run_1": first, "post_run_status": after1}

    second = run(f"{repo_name}_recovery_run2", repo, second_args)
    after2 = clean_status(repo)
    second["working_tree_clean_after"] = not bool(after2)
    qualified = second.get("status") == "PASS" and not after2
    return {
        "status": "PASS_TWO_RUNS" if qualified else "RUN2_NOT_QUALIFIED",
        "commit": current,
        "run_1": first,
        "run_2": second,
        "post_run_status": after2,
    }


def recover_attrs() -> dict[str, Any]:
    repo = REPOS / "attrs"
    expected = EXPECTED["attrs"]
    before = git(repo, "rev-parse", "HEAD")
    if before != expected:
        return {"status": "PIN_MISMATCH", "actual_commit": before, "expected_commit": expected}
    shallow = git(repo, "rev-parse", "--is-shallow-repository") == "true"
    result: dict[str, Any] = {"commit_before": before, "was_shallow": shallow}
    if shallow:
        fetch = run("attrs_fetch_full_history_and_tags", repo, ["git", "fetch", "--unshallow", "--tags", "origin"], timeout=600)
        result["fetch"] = fetch
        if fetch.get("status") != "PASS":
            result["status"] = "TAG_FETCH_FAILED"
            return result
    after = git(repo, "rev-parse", "HEAD")
    result["commit_after"] = after
    result["describe"] = git(repo, "describe", "--tags", "--long", "--always")
    result["shallow_after"] = git(repo, "rev-parse", "--is-shallow-repository")
    if result["describe"] == after[:7]:
        result["status"] = "TAGS_STILL_UNAVAILABLE"
        return result
    dirty = clean_status(repo)
    result["working_tree_clean"] = not bool(dirty)
    result["git_status"] = dirty
    if after != expected or dirty:
        result["status"] = "POST_FETCH_PREFLIGHT_FAILED"
        return result
    pair = run_pair("attrs", "3.12-tests", force_first=True)
    result["baseline"] = pair
    result["status"] = pair["status"]
    return result


def recover_requests() -> dict[str, Any]:
    repo = REPOS / "requests"
    expected = EXPECTED["requests"]
    current = git(repo, "rev-parse", "HEAD")
    if current != expected:
        return {"status": "PIN_MISMATCH", "actual_commit": current, "expected_commit": expected}
    status = clean_status(repo)
    if status:
        return {"status": "PREFLIGHT_BLOCKED", "reason": status}

    openssl = shutil.which("openssl")
    make = shutil.which("make") or shutil.which("mingw32-make")
    cert_root = repo / "tests" / "certs"
    cert_file = cert_root / "valid" / "ca" / "ca.crt"
    result: dict[str, Any] = {
        "commit": current,
        "openssl_executable": openssl,
        "make_executable": make,
        "certificate_expected": str(cert_file),
        "certificate_existed_before": cert_file.exists(),
    }
    # Persist the repository's own certificate instructions for later review.
    readme = cert_root / "README.md"
    result["certificate_readme"] = readme.read_text(encoding="utf-8", errors="replace") if readme.exists() else "README.md missing"
    if openssl:
        result["openssl_version"] = run("requests_openssl_version", repo, [openssl, "version"], timeout=30)
    if not make:
        result["status"] = "MAKE_NOT_FOUND"
        result["action_required"] = "Install GNU Make (or use Git Bash with make available on PATH), then rerun this recovery script."
        return result

    # Upstream Requests test fixtures are generated by the Makefiles.
    # Build valid/server first, then expired and mtls; these are ignored test artifacts.
    targets = ["tests/certs/valid/server", "tests/certs/expired", "tests/certs/mtls"]
    builds = []
    for target in targets:
        makefile = repo / target / "Makefile"
        if not makefile.is_file():
            builds.append({"target": target, "status": "MAKEFILE_MISSING"})
            continue
        builds.append({
            "target": target,
            **run(
                "requests_cert_build_" + target.replace("/", "_"),
                repo,
                [make, "-C", target, "clean", "all"],
                timeout=180,
            ),
        })
        if builds[-1].get("status") != "PASS":
            result["certificate_builds"] = builds
            result["status"] = "CERTIFICATE_BUILD_FAILED"
            return result
    result["certificate_builds"] = builds
    result["certificate_exists_after"] = cert_file.exists()
    result["working_tree_status_after_build"] = clean_status(repo)
    if not cert_file.exists():
        result["status"] = "CERTIFICATE_STILL_MISSING"
        return result
    if result["working_tree_status_after_build"]:
        result["status"] = "GENERATED_FILES_NOT_IGNORED"
        return result
    pair = run_pair("requests", "py312-default", force_first=True)
    result["baseline"] = pair
    result["status"] = pair["status"]
    return result


def recover_rich() -> dict[str, Any]:
    repo = REPOS / "rich"
    expected = EXPECTED["rich"]
    current = git(repo, "rev-parse", "HEAD")
    if current != expected:
        return {"status": "PIN_MISMATCH", "actual_commit": current, "expected_commit": expected}
    dirty = clean_status(repo)
    if dirty:
        return {"status": "PREFLIGHT_BLOCKED", "reason": dirty}
    poetry = repo / ".tox" / "py312" / "Scripts" / "poetry.exe"
    if not poetry.is_file():
        return {"status": "POETRY_EXECUTABLE_NOT_FOUND", "expected": str(poetry)}

    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    mirror = OUT / f"rich_isolated_source_{stamp}"
    ignore = shutil.ignore_patterns(
        ".git", ".tox", ".venv", "__pycache__", ".pytest_cache",
        ".mypy_cache", ".ruff_cache", "build", "dist", "*.egg-info",
        ".coverage*", "htmlcov",
    )
    shutil.copytree(repo, mirror, ignore=ignore)
    original_lock = repo / "poetry.lock"
    copied_lock = mirror / "poetry.lock"
    original_lock_hash = hashlib.sha256(original_lock.read_bytes()).hexdigest() if original_lock.exists() else None
    env = os.environ.copy()
    env["POETRY_VIRTUALENVS_IN_PROJECT"] = "true"
    env["POETRY_VIRTUALENVS_CREATE"] = "true"
    env["POETRY_NO_INTERACTION"] = "1"
    result: dict[str, Any] = {
        "status": "STARTED",
        "classification": "SUPPLEMENTARY_RELOCKED_ENVIRONMENT_NOT_NATIVE_UPSTREAM_LOCK",
        "original_commit": current,
        "original_worktree_clean": True,
        "original_lock_sha256": original_lock_hash,
        "mirror": str(mirror),
        "poetry_executable": str(poetry),
    }
    version = run("rich_poetry_version", mirror, [str(poetry), "--version"], timeout=60, env=env)
    result["poetry_version"] = version
    if version.get("status") != "PASS":
        result["status"] = "POETRY_LAUNCH_FAILED"
        return result
    lock = run("rich_mirror_lock", mirror, [str(poetry), "lock", "--no-interaction"], timeout=900, env=env)
    result["lock_generation"] = lock
    if lock.get("status") != "PASS":
        result["status"] = "LOCK_REGENERATION_FAILED"
        return result
    if not copied_lock.exists():
        result["status"] = "LOCK_FILE_NOT_CREATED"
        return result
    result["regenerated_lock_sha256"] = hashlib.sha256(copied_lock.read_bytes()).hexdigest()
    install = run("rich_mirror_install", mirror, [str(poetry), "install", "--no-interaction"], timeout=1200, env=env)
    result["install"] = install
    if install.get("status") != "PASS":
        result["status"] = "ISOLATED_INSTALL_FAILED"
        return result
    test_cmd = [
        str(poetry), "run", "pytest", "--cov-report", "term-missing",
        "--cov=rich", "tests/",
    ]
    first = run("rich_mirror_test_run1", mirror, test_cmd, timeout=1200, env=env)
    result["run_1"] = first
    if first.get("status") != "PASS":
        result["status"] = "ISOLATED_TEST_RUN1_FAILED"
        return result
    second = run("rich_mirror_test_run2", mirror, test_cmd, timeout=1200, env=env)
    result["run_2"] = second
    result["status"] = "PASS_TWO_RUNS_REGENERATED_LOCK" if second.get("status") == "PASS" else "ISOLATED_TEST_RUN2_FAILED"
    result["original_repo_still_clean"] = not bool(clean_status(repo))
    result["original_commit_after"] = git(repo, "rev-parse", "HEAD")
    return result


def recover_werkzeug() -> dict[str, Any]:
    repo = REPOS / "werkzeug"
    expected = EXPECTED["werkzeug"]
    current = git(repo, "rev-parse", "HEAD")
    if current != expected:
        return {"status": "PIN_MISMATCH", "actual_commit": current, "expected_commit": expected}
    dirty = clean_status(repo)
    if dirty:
        return {"status": "PREFLIGHT_BLOCKED", "reason": dirty}
    python_exe = repo / ".tox" / "py3.12" / "Scripts" / "python.exe"
    tox_exe = repo / ".tox" / "py3.12" / "Scripts" / "tox.exe"
    result: dict[str, Any] = {
        "commit": current,
        "existing_env_python_exists": python_exe.exists(),
        "existing_env_tox_exists": tox_exe.exists(),
        "strategy": "reuse existing tox environment; do not use -r",
    }
    # If the env's Python is missing, let Tox create it once without -r.
    first_args = [sys.executable, "-m", "tox", "-e", "py3.12"]
    first = run("werkzeug_recovery_run1", repo, first_args, timeout=1200)
    first["working_tree_clean_after"] = not bool(clean_status(repo))
    result["run_1"] = first
    if first.get("status") != "PASS" or not first["working_tree_clean_after"]:
        result["status"] = "RUN1_NOT_QUALIFIED"
        return result
    second = run("werkzeug_recovery_run2", repo, first_args, timeout=1200)
    second["working_tree_clean_after"] = not bool(clean_status(repo))
    result["run_2"] = second
    result["status"] = (
        "PASS_TWO_RUNS" if second.get("status") == "PASS" and second["working_tree_clean_after"]
        else "RUN2_NOT_QUALIFIED"
    )
    return result


def main() -> int:
    print("HOROS I06 03E — targeted baseline recovery", flush=True)
    print("Workspace:", WORKSPACE, flush=True)
    print("Recovery logs:", OUT, flush=True)
    print("No model API calls will be made.", flush=True)

    jobs = [
        ("attrs", recover_attrs),
        ("requests", recover_requests),
        ("rich", recover_rich),
        ("werkzeug", recover_werkzeug),
    ]
    for name, fn in jobs:
        print(f"\n========== {name.upper()} =========", flush=True)
        try:
            RESULTS["repositories"][name] = fn()
        except Exception as exc:
            RESULTS["repositories"][name] = {"status": "RECOVERY_SCRIPT_ERROR", "error": repr(exc)}
            print("RECOVERY ERROR:", repr(exc), flush=True)
        (OUT / "recovery_results.json").write_text(json.dumps(RESULTS, indent=2), encoding="utf-8")
        print("RECOVERY STATUS:", RESULTS["repositories"][name].get("status"), flush=True)

    report = [
        "# HOROS I06 03E — Targeted Baseline Recovery",
        "",
        f"Created UTC: {RESULTS['created_at_utc']}",
        "",
        "| Repository | Recovery status | Interpretation |",
        "|---|---|---|",
    ]
    for name, rec in RESULTS["repositories"].items():
        status = rec.get("status", "UNKNOWN")
        interp = {
            "PASS_TWO_RUNS": "Two successful upstream-native runs",
            "PASS_TWO_RUNS_REGENERATED_LOCK": "Two successful runs in isolated copy with regenerated Poetry lock; not native lock baseline",
            "TAG_FETCH_FAILED": "Could not retrieve tag history",
            "MAKE_NOT_FOUND": "GNU Make unavailable; Requests fixtures not generated",
            "CERTIFICATE_BUILD_FAILED": "Requests test fixture generation failed",
            "CERTIFICATE_STILL_MISSING": "Expected CA fixture still absent",
            "RUN1_NOT_QUALIFIED": "First retry failed",
            "RUN2_NOT_QUALIFIED": "Second retry failed",
        }.get(status, "See machine-readable recovery record and logs")
        report.append(f"| {name} | {status} | {interp} |")
    report += [
        "",
        "## Important qualifications",
        "",
        "- Original baseline state and logs were not overwritten.",
        "- ATTRS recovery changes Git metadata only by fetching full history and tags; HEAD must remain pinned.",
        "- Requests generation writes local test fixtures through upstream Makefiles; tracked source must remain unchanged.",
        "- Rich runs from a copied checkout with a newly resolved lockfile and is supplementary, not equivalent to the original pinned lockfile environment.",
        "- Werkzeug retries the existing Tox environment without forcing recreation.",
        "- No model API calls are made.",
    ]
    (OUT / "recovery_report.md").write_text("\n".join(report) + "\n", encoding="utf-8")
    print("\nRECOVERY COMPLETE")
    print("JSON:", OUT / "recovery_results.json")
    print("Report:", OUT / "recovery_report.md")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
