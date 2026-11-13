# Model Evaluation Benchmark Report: `HOROS-WM-vNext-pilot-mock`

**Task:** `compliant_prelift`  
**Overall Gate Status:** **PASSED**  

## 1. Multi-Horizon Prediction Error vs Frozen Baseline B3

| Horizon | Model MSE | Frozen B3 MSE | MSE Reduction (%) | Target | Status |
| --- | ---: | ---: | ---: | ---: | :---: |
| $H=1$ | `0.021196` | `0.045000` | `+52.9%` | $\ge 40\%$ | **PASS** |
| $H=3$ | `0.021173` | `0.180000` | `+88.2%` | $\ge 40\%$ | **PASS** |
| $H=5$ | `0.023940` | `0.420000` | `+94.3%` | $\ge 40\%$ | **PASS** |
| $H=10$ | `0.022564` | `1.250000` | `+98.2%` | $\ge 40\%$ | **PASS** |
| $H=20$ | `0.023545` | `3.800000` | `+99.4%` | $\ge 40\%$ | **PASS** |

## 2. Latent Physical Parameter Identification & OOD Generalization

| Metric | Result | Target Criterion | Gate Status |
| --- | ---: | ---: | :---: |
| Friction Identification ($R^2$) | `0.9486` | $\ge 0.60$ | **PASS** |
| Mass Identification ($R^2$, Active) | `0.9754` | $\ge 0.60$ | **PASS** |
| OOD Discrimination AUROC (`LowMu`) | `1.0000` | $\ge 0.85$ | **PASS** |

## 3. Contact-Mode Conformal Calibration Coverage

| Contact Mode | Empirical Coverage | Nominal Target | Status |
| --- | ---: | ---: | :---: |
| `Free` | `91.0%` | $90.0\%$ | **PASS** |
| `FirstContact` | `94.0%` | $90.0\%$ | **PASS** |
| `Sticking` | `92.0%` | $90.0\%$ | **PASS** |
| `Sliding` | `90.0%` | $90.0\%$ | **PASS** |
| `Impact` | `93.0%` | $90.0\%$ | **PASS** |