# HOROS PROBE-1 Experiment Specification
## EXP-009: Continual Physical Learning and Mistake Immunity

* **Experiment ID:** EXP-009
* **Title:** Non-Parametric Epistemic Memory for One-Shot Physical Failure Avoidance
* **Research Hypothesis:** Hypothesis 7 — Incorporating a non-parametric episodic key-value memory of past dynamic failures and corrective recoveries enables one-shot mistake immunity ($\ge 85\%$ avoidance of previously failed physical states upon encountering identical geometric/contact conditions) without requiring online parameter gradient updates, thereby eliminating catastrophic forgetting ($\le 3\%$ performance degradation on previously mastered base tasks).
* **Research Question:** Can a humanoid robot immediately remember and avoid a specific physical failure mode (e.g., slipping on a particular slick floor tile or dropping a slippery cup) from a single demonstration/failure episode without fine-tuning neural network weights?
* **Baseline Models:**
  1. *Frozen Foundation Baseline:* Fixed pretrained PROBE-1 model with no memory mechanism (repeats the same failure).
  2. *Online Gradient Adaptation (LoRA Fine-Tuning):* Rapid online low-rank gradient updates on the single failure trajectory.
  3. *Replay Buffer Baseline:* Periodic retraining with experience replay combining past success data and new failure transitions.
* **Proposed Method:** PROBE-1 Epistemic Memory Architecture:
  * Multimodal physical embeddings $z_{\text{phys}} \in \mathbb{R}^{512}$ indexed into an approximate nearest-neighbor vector database (HNSW / FAISS).
  * Episodic failure keys store state signatures leading to torque saturation, slip, or collision; corresponding values store corrective dynamic biases $\Delta u_{\text{safe}}$.
  * During inference, if the query physical embedding matches a known failure state within distance $\tau_{\text{thresh}}$, the policy output is conditioned on or blended with the stored corrective recovery bias without altering neural weights.
* **Datasets:**
  * Base Pretraining Split: DROID + Humanoid Everyday standard manipulation suite (50 base manipulation tasks).
  * Continuous Novel Challenges: 20 sequential novel obstacle/manipulation failure challenges (e.g., icy floor patch, deformable slippery bottle, compliant spring door with hidden deadbolt).
* **Training Configuration:**
  * Pretrained trunk frozen (zero weight updates during deployment).
  * Memory index populated dynamically in real time whenever an intervention or fall occurs.
* **Evaluation Environment:**
  * Hardware Testbed: Physical Unitree G1 humanoid deployed in a sequenced 5-station continuous physical evaluation track.
* **Hardware Requirements:** Onboard industrial PC with fast NVMe storage and GPU-accelerated FAISS vector retrieval engine ($< 2.0\text{ ms}$ query latency for 100,000 episodic vectors).
* **Independent Variables:** Continual learning mechanism: (1) Frozen Baseline, (2) Online LoRA Gradient Updates, (3) Experience Replay, (4) PROBE-1 Epistemic Memory.
* **Dependent Variables:** Repeat failure rate on novel challenge tasks (%), backward transfer / retention accuracy on 50 base tasks (%), adaptation latency (s), inference computation overhead (ms).
* **Control Variables:** Robot kinematics, ambient room lighting, object masses, test sequence order.
* **Metrics:** Mistake Immunity Rate ($M_{\text{immune}} = 1 - P_{\text{repeat\_failure}}$), Backward Transfer Degradation ($\Delta S_{\text{base}} = S_{\text{base, original}} - S_{\text{base, current}}$), Memory Query Latency ($t_{\text{query}}$).
* **Sample-Size Justification:** $N = 20$ novel failure modes tested across 10 repeated encounters per condition ($200$ test encounters per method; $800$ total physical trials) provides $95\%$ power to verify an immunity rate difference of $\ge 30\%$ at $\alpha = 0.01$.
* **Statistical Analysis:** Two-way repeated-measures ANOVA (method $\times$ task sequence index); paired t-tests evaluating backward retention against original base task scores.
* **Ablation Studies:**
  * Vary memory lookup distance threshold $\tau_{\text{thresh}}$.
  * Ablate tactile/force tokens in the indexing embedding (vision-only episodic memory vs. multimodal physical memory).
  * Scale memory size from $10^2$ to $10^5$ episodes to test retrieval latency scaling.
* **Failure Conditions:** Robot repeats a known failure when re-encountering the identical challenge, or base task success drops by $> 5\%$ (indicating catastrophic forgetting).
* **Reproducibility Requirements:** Deterministic state logging, immutable sequence order of novel challenges, and serialized FAISS memory index files with timestamp verification.
* **Expected Outcome:** Epistemic memory achieves $88\%$ one-shot mistake immunity on re-encountered obstacles with $0.0\%$ degradation on the 50 base tasks, while online LoRA updates suffer $14\%$ catastrophic forgetting on base tasks due to gradient interference.
* **Decision Criteria:** Hypothesis 7 is supported if the non-parametric epistemic memory module achieves $\ge 85\%$ mistake immunity on identical re-encounters without gradient updates, while maintaining backward transfer degradation $\le 3\%$ ($p < 0.001$) and memory lookup latency $\le 2.0\text{ ms}$.

