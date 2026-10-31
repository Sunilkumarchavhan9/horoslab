# arXiv Submission Package: HOROS PROBE-1

**Paper Title:** *Uncertainty-Aware Safe Adaptation for Multifingered Grasping Under Jointly Changing Contact Conditions*  
**Primary Category:** `cs.RO` (Robotics)  
**Cross-List Category:** `eess.SY` (Systems and Control)  
**License:** arXiv Perpetual, Non-Exclusive License  
**Author:** Sunil Kumar Chavhan (HOROS Physical Intelligence Research Group, `sunil@horoslab.io`)  
**Structural Benchmark:** AutoMegaKernel (arXiv:2606.09682) Quality & Presentation Standard  

---

## 1. Directory Structure

```
arxiv_submission/
├── main.tex                    # Master LaTeX document (single-column article layout)
├── references.bib              # Verified BibTeX bibliography (17 primary peer-reviewed citations)
├── check_latex.py              # Automated validation script verifying labels, cites & env balance
├── generate_paper_figures.py   # Publication figure engine generating vector PDFs from JSON
├── README.md                   # Submission dossier and build instructions
├── sections/                   # 10 Modular LaTeX paper sections
│   ├── 01-introduction.tex               # Problem, VLA trilemma, 6 numbered contributions
│   ├── 02-related-work.tex               # Taxonomy & Prior-Art Comparison Table
│   ├── 03-problem-formulation.tex        # Hunt-Crossley sensitivity & P_8 polyhedral cone
│   ├── 04-system-architecture.tex        # Information flow & System Architecture (Fig 1)
│   ├── 05-technical-method.tex           # ACI module, QP filter, Algorithm 1 box, Fig 2
│   ├── 06-theoretical-analysis.tex       # Invariance proof, nullspace decoupling proof
│   ├── 07-experimental-evaluation.tex    # Isaac Lab/PhysX 5 setup, Table 2, Fig 3 & 4
│   ├── 08-ablation-and-generalization.tex# 7 ablations (Fig 5), 3 findings, OOD tests (Fig 6, 7)
│   ├── 09-limitations-and-discussion.tex # Simulation boundaries, benchtop ATI validation
│   └── 10-conclusion.tex                 # Conclusions, code, data & test availability
└── figures/                              # Seven publication vector PDF figures
    ├── architecture.pdf                  # Figure 1: End-to-end information & control flow
    ├── safety_filter_diagram.pdf         # Figure 2: Detailed QP optimization & decision gate
    ├── estimation_results.pdf            # Figure 3: State estimation error & ACI tracking
    ├── controller_comparison.pdf         # Figure 4: Benchmark survival & Regime D drop rates
    ├── ablation_results.pdf              # Figure 5: Systematic 7-component ablation study
    ├── latency_analysis.pdf              # Figure 6: Real-time latency percentiles vs watchdog
    └── generalization_results.pdf        # Figure 7: OOD survival & analytical phase diagram
```

---

## 2. Re-Generating Figures From Raw Ledger

All seven figures are generated directly from the audited empirical evaluation results ([`../experiments/full_evaluation_results.json`](file:///c:/projects/MemoryOS/research/PROBE-1/experiments/full_evaluation_results.json)):
```bash
python generate_paper_figures.py
# Output: 7 vector PDF figures in figures/
```

---

## 3. LaTeX Compilation Instructions

### Using `latexmk` (Recommended for arXiv automated builds):
```bash
cd research/PROBE-1/arxiv_submission
latexmk -pdf -interaction=nonstopmode -halt-on-error main.tex
```

### Manual Compilation Pipeline:
```bash
pdflatex main.tex
bibtex main
pdflatex main.tex
pdflatex main.tex
```
Output artifact: `main.pdf`.

---

## 4. arXiv Submission Checklist (AutoMegaKernel Standard)

- [x] **Clear Authorship:** Sunil Kumar Chavhan, HOROS Physical Intelligence Research Group, `sunil@horoslab.io`.
- [x] **Category Selection:** Primary `cs.RO` (Robotics), Secondary `eess.SY` (Systems and Control).
- [x] **Self-Contained Archive:** All 7 figures, 10 sections, and references are locally bundled.
- [x] **Prior-Art Taxonomy Table:** Section 2 features Table 1 comparing OpenVLA, $\pi_0$, RT-2, TacClaw-Infinity, PANDAS, and Ames CBF.
- [x] **System Architecture Diagrams:** Figure 1 (Overall system flow) and Figure 2 (QP safety filter and decision gate).
- [x] **Mathematical Algorithm Box:** Algorithm 1 in Section 5 details the 100~Hz predictive safety filter execution loop.
- [x] **No Fabricated References:** Every BibTeX entry is checked against primary peer-reviewed venues.
- [x] **Data-Grounded Figures:** All 7 PDF plots are generated directly from the 3,400-trial experimental ledger.
- [x] **Honest Simulation Stance:** Section 9 explicitly identifies simulated measurements in Isaac Lab v2.3 / PhysX 5 and specifies the benchtop physical validation rig for laboratory transfer.
- [x] **Deep-Dive into Key Findings:** Section 8 thoroughly analyzes (i) 100% baseline failure vs 0% HOROS in Regime D, (ii) heavy payload saturation boundary, and (iii) 100% crushing without proprioception.
