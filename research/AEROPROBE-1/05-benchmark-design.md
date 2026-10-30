# HOROS First-Party Model Program: AEROPROBE-1
## 05 — Benchmark Design & Evaluation Suite

### 1. Aerospace Verification & Validation (V&V) Matrix
AEROPROBE-1 benchmarks adhere strictly to AIAA and AGARD aerodynamic validation standards:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Suite A: Classical 2D Transonic Shock Benchmark                            │
│ - RAE 2822 Airfoil (Cases 9, 10: Ma=0.73, α=2.79°, Re=6.5×10⁶)              │
│ - Supercritical shock boundary layer interaction, separation bubble audit   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Suite B: Classical 3D Transonic Swept Wing                                  │
│ - ONERA M6 Wing (Ma=0.84, α=3.06°, Re=11.7×10⁶)                             │
│ - Dual λ-shock capture along spanwise stations (η = 0.20, 0.44, 0.65, 0.90)  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Suite C: Complete Aircraft Configuration (AIAA DPW-VI / DPW-VII)            │
│ - NASA Common Research Model (CRM) Wing-Body-Nacelle-Pylon (WBNP)           │
│ - High-Lift Common Research Model (CRM-HL) with slats/flaps deployed        │
│ - Target: Drag polar accuracy within 1 drag count across cruise envelope   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Quantitative Verification Metrics
1. **Integrated Force Polar Deviation:**
   $$\Delta C_L = |C_{L,\\text{pred}} - C_{L,\\text{cfd}}| \le 0.0050$$
   $$\Delta C_D = |C_{D,\\text{pred}} - C_{D,\\text{cfd}}| \le 0.00010 \quad (1.0\\text{ drag count})$$
   $$\Delta C_m = |C_{m,\\text{pred}} - C_{m,\\text{cfd}}| \le 0.0020$$

2. **Surface Pressure Distribution Error ($L_1$ and $L_\\infty$):**
   $$\epsilon_{C_p} = \frac{1}{N} \sum_{i=1}^N |C_{p,\\text{pred}}(x_i) - C_{p,\\text{cfd}}(x_i)| \le 0.015$$
   $$\|C_{p,\\text{pred}} - C_{p,\\text{cfd}}\|_\infty \le 0.080 \quad (\text{Peak shock pressure error})$$

3. **Mass and Momentum Conservation Residual Error:**
   $$\mathcal{R}_{\\text{mass}} = \int_{\partial \Omega} \rho \mathbf{u} \cdot \mathbf{n} \, dA \approx 0$$
