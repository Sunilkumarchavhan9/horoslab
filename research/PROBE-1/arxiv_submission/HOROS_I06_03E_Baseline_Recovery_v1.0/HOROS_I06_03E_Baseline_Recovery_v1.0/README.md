# HOROS I06 03E — Targeted Baseline Recovery v1.0

This recovery runner addresses the four unresolved repository baselines:

- **attrs:** fetch full Git history and tags; verify the pinned HEAD remains unchanged; rerun the declared Tox environment twice.
- **Requests:** generate only the repository's local TLS test fixtures using its own Makefiles, then rerun its declared Tox environment twice. The generation order is `valid/server`, `expired`, `mtls`.
- **Rich:** use the Poetry executable installed in its failed Tox environment to make a copy of the pinned checkout, regenerate the Poetry lock only in that copy, install dependencies there, and run the same pytest suite twice. This is clearly classified as a supplementary regenerated-lock environment, not the original upstream lock baseline.
- **Werkzeug:** retry the existing Tox environment without `-r`, avoiding a forced virtual-environment recreation.

## Safety / reproducibility notes

- The original baseline state and logs are preserved. Recovery output is written separately to `workspace/baseline_qualification/recovery_v1/`.
- Each repository's pinned Git commit is checked before recovery.
- ATTRS must retain its pinned HEAD after the tag fetch.
- Requests fixture generation uses upstream Makefiles and must leave the tracked worktree clean. Generated local fixtures are test support artifacts.
- Rich is copied to a separate recovery directory. No file in the pinned Rich checkout is modified. Its new lock hash is recorded.
- Werkzeug is invoked without forcing Tox to delete its current environment.
- No model API calls are made. Git fetch, test fixture generation, dependency installation and test suites may use the network.

## Run from Jupyter

Extract this ZIP into Downloads, then run:

```python
from pathlib import Path
import zipfile, os

zip_path = Path.home() / "Downloads" / "HOROS_I06_03E_Baseline_Recovery_v1.0.zip"
with zipfile.ZipFile(zip_path) as z:
    z.extractall(Path.home() / "Downloads")

script = Path.home() / "Downloads" / "HOROS_I06_03E_Baseline_Recovery_v1.0" / "src" / "recover_baselines.py"
assert script.exists(), script
os.chdir(script.parent.parent)

get_ipython().run_line_magic("run", f'"{script.as_posix()}"')
```

The runner will save `recovery_results.json`, `recovery_report.md`, and individual command logs under the existing 03E workspace.
