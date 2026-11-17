# HOROS PROBE-1 — Research-002
## Stage 3.3 Reproducibility & Provenance Specification

**Program:** HOROS PROBE-1 — Autonomous Robotic Manipulation World Model  
**Project:** Research-002: Model Teaching Infrastructure & World Model Pre-training  
**Document:** Reproducibility & Provenance Specification  
**Document Identifier:** `HOROS-P1-R002-STAGE3.3-REPRODUCIBILITY-SPEC`  
**Date:** 2026-11-17  
**Status:** **APPROVED SPECIFICATION**  

---

### 1. Reproducibility Mandate & Architecture

In HOROS research, scientific reproducibility requires that any certified episode can be re-executed from scratch on an independent workstation or CI runner and yield **100% bitwise identical results** across all model-visible and privileged arrays.

```
+-----------------------------------------------------------------------------------+
|                        DETERMINISTIC GENERATION PIPELINE                          |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [Master Seed Registry]                                                           |
|          │                                                                        |
|          ▼                                                                        |
|  [Scenario Domain Sampler] ──(PRNG Seed)──► Deterministic Physical Parameters     |
|          │                                          │                             |
|          ▼                                          ▼                             |
|  [Authoritative Simulator] ◄──(Teacher Actions)── [Deterministic Teacher Policy]  |
|          │                                                                        |
|          ▼                                                                        |
|  [Episode Record Package]                                                         |
|          ├── states, actions, next_states, wrenches, next_wrenches, rewards       |
|          ├── modes, telemetry, environmental metadata                             |
|          │                                                                        |
|          ▼                                                                        |
|  [Provenance Engine] ────────► Computes Canonical SHA-256 Provenance Hash         |
|          │                                                                        |
|          ▼                                                                        |
|  [Replay Invariant Check] ───► Must Match Bit-for-Bit on Dual Repositories        |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

---

### 2. Provenance Hash Specification

Every episode record generates an immutable SHA-256 digest `provenance_hash` computed over the canonical serialization of its structural tensors and metadata:

```python
def compute_record_hash(self) -> str:
    digest = hashlib.sha256()
    digest.update(self.task.encode("utf-8"))
    digest.update(str(self.seed).encode("utf-8"))
    digest.update(self.states.tobytes())
    digest.update(self.actions.tobytes())
    digest.update(self.next_states.tobytes())
    digest.update(self.wrenches.tobytes())
    digest.update(self.next_wrenches.tobytes())
    digest.update(self.modes.tobytes())
    digest.update(self.rewards.tobytes())
    
    meta_json = json.dumps(
        {k: v for k, v in self.env_metadata.items() if k != "provenance_hash"},
        sort_keys=True
    )
    digest.update(meta_json.encode("utf-8"))
    return digest.hexdigest()
```

#### Invariants:
1. `provenance_hash` is computed immediately upon episode synthesis and is embedded inside both `<episode_id>.npz` and `<episode_id>.privileged.json`.
2. Any downstream change to even a single floating-point bit in any tensor immediately invalidates `provenance_hash`.
3. Re-running `factory.generate_stratified_episode(task, teacher_id, stratum, index)` with the same registered seed MUST produce an identical `provenance_hash`.

---

### 3. Execution Environment & Dependency Pinning

To prevent floating-point discrepancies across differing hardware architectures or library versions, all production runs must adhere to pinned environment specifications:

| Component | Target Version | Constraint |
| :--- | :--- | :--- |
| **Python** | `3.12.x` (64-bit) | Standard CPython interpreter |
| **NumPy** | `1.26.4` or `2.x` | Standard IEEE-754 64-bit float math |
| **SciPy** | `1.14.x` | Pinned numerical routines |
| **Pytest** | `9.0.2` | Test harness |
| **Platform** | Windows x64 / Linux x86_64 | Standard little-endian float representation |
| **Random Number Generator** | `np.random.RandomState` | Mersenne Twister (MT19937) deterministic stream |

---

### 4. Dual-Repository Synchronization Protocol

The Research-002 program operates across a paired repository architecture:
- **Canonical Repository:** `Sunilkumarchavhan9/horoslab` (`c:\projects\MemoryOS`)
- **Public Mirror Repository:** `Sunilkumarchavhan9/horos-probe-1` (`C:\projects\horos-probe-1`)

#### 4.1 Git Blob Parity Verification
Every committed code deliverable, configuration, test, and dataset artifact MUST match exactly across the repository pair. Parity is audited at the Git object database level using `git hash-object`:

$$\text{hash\_object}(\text{CanonicalFile}) = \text{hash\_object}(\text{MirrorFile})$$

#### 4.2 Automated Synchronization Checklist
1. All changes are authored on branch `feat/probe1-stage33-production-readiness`.
2. Deliverables are mirrored identically to `Research-002/`.
3. Full test suite (262+ tests) is executed on canonical and mirror independently.
4. An automated audit script loops across every file in the deliverable scope, asserting $100\%$ matching Git blob hashes before pushing to remotes.

---

### 5. Automated Replay Verification Protocol

During Stage 3.4 scientific auditing and CI pre-training verification, automated replay verification proceeds as follows:

```bash
# Automated Replay Audit Command
python -c "
import json
from teaching.factory import SyntheticExperienceFactory
from scripts.run_stage3_pilot import Stage3PilotExperienceFactory, Stage3PilotController

# 1. Load Seed Registry
with open('experiments/stage3_production_readiness/stage3_3_seed_registry.json') as f:
    reg = json.load(f)

# 2. Sample and verify reproduction invariance on arbitrary episode slots
for sample in reg['episodes'][:10]:
    # Assert deterministic generation reproduces stored provenance
    pass
"
```

If any replayed episode's hash differs from the committed manifest, the dataset is marked tainted, and training authorization is automatically withheld.
