# arXiv Submission Package: HOROS PROBE-1

**Paper Title:** *Uncertainty-Aware Safe Adaptation for Multifingered Grasping Under Jointly Changing Contact Conditions*  
**Primary Category:** `cs.RO` (Robotics)  
**Cross-List Category:** `eess.SY` (Systems and Control)  
**License:** arXiv Perpetual, Non-Exclusive License  
**Authors:** HOROS Physical Intelligence Research Group  

---

## 1. Directory Structure

```
arxiv_submission/
├── main.tex                    # Master LaTeX document
├── references.bib              # Verified BibTeX bibliography
├── generate_paper_figures.py   # Script generating all figures from raw data
├── README.md                   # Submission dossier and build instructions
├── sections/                   # Modular LaTeX paper sections
│   ├── 01-introduction.tex
│   ├── 02-related-work.tex
│   ├── 03-problem-formulation.tex
│   ├── 04-methodology.tex
│   ├── 05-theoretical-analysis.tex
│   ├── 06-experimental-setup.tex
│   ├── 07-results.tex
│   ├── 08-limitations.tex
│   └── 09-conclusion.tex
└── figures/                    # Six publication vector PDF figures
    ├── architecture.pdf
    ├── estimation_results.pdf
    ├── controller_comparison.pdf
    ├── ablation_results.pdf
    ├── latency_analysis.pdf
    └── generalization_results.pdf
```

---

## 2. Re-Generating Figures From Raw Ledger

All six figures are generated directly from the audited empirical evaluation results ([`../experiments/full_evaluation_results.json`](file:///c:/projects/MemoryOS/research/PROBE-1/experiments/full_evaluation_results.json)):
```bash
python generate_paper_figures.py
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

## 4. arXiv Submission Checklist

- [x] **Category Selection:** Primary `cs.RO` (Robotics), Secondary `eess.SY` (Systems and Control).
- [x] **Self-Contained Archive:** All figures, sections, and references are locally bundled.
- [x] **No Fabricated References:** Every BibTeX entry is checked against primary peer-reviewed venues.
- [x] **Data-Grounded Figures:** All 6 PDF plots are generated directly from the 3,400-trial experimental ledger.
- [x] **Simulation Stance Explicit:** Section 8 explicitly states the GPU-accelerated simulation environment and provides the benchtop physical validation protocol.
- [x] **Statistical Rigor:** Table results report exact $N = 100$ independent seeds, 95% Wilson and bootstrap confidence intervals, and Holm-Bonferroni corrected hypothesis tests.
