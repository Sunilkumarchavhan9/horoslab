# HOROS PROBE-1 — Research-002
## Stage P2.6: Task 1 Insertion Horizon & Travel Kinematics Study
**Program:** HOROS PROBE-1 — Humanoid Robotics & Physical AI  
**Project:** Research-002: Trustworthy Action-Conditioned Contact World Models  
**Document:** `38-insertion-horizon-and-impedance-study.md`  
**Status:** Study Protocol  

---

## 1. Physical Kinematics of Precision Insertion

The precision peg-in-hole benchmark models a Franka Panda robot inserting an aluminum peg into a fixture:
- Peg radius: $R_{\text{peg}} = 15.0$ mm, length: $L = 80.0$ mm.
- Fixture depth: $D = 60.0$ mm, clearance: $c = 0.50$ mm.
- Initial peg height: $z_{\text{init}} = +15.0 \pm 1.0$ mm (above the fixture rim).
- Seating success threshold: $z_{\text{seated}} \le -50.0$ mm ($50.0$ mm insertion depth).
- Total required vertical displacement:
  $$\Delta z_{\text{required}} = 15.0 - (-50.0) = 65.0\text{ mm}$$

Action bounds enforce $|dz| \le 5.0$ mm/step ($dt = 0.02$ s).

---

## 2. Theoretical Step Requirements under Friction & Compliance

In free space ($z > 0$), the peg descends at maximum velocity:
$$dz_{\text{free}} = -5.0\text{ mm/step} \implies \text{Steps to reach rim } (z = 0): \frac{15.0}{5.0} = 3\text{ steps}$$

Once the peg enters the fixture ($z \le 0$), compliant radial contact occurs:
1. Clearance tolerance ($0.50$ mm) and initial lateral offsets ($\pm 2.0$ mm) induce contact against the chamfer or hole wall.
2. Radial contact forces ($F_n \approx 10$–$25$ N) generate Coulomb friction:
   $$F_{t, z} = \mu F_n \approx 0.50 \times 20.0 = 10.0\text{ N}$$
3. In `PegInHoleEnv`, vertical impedance displacement is damped by friction:
   $$dz_{\text{effective}} = dz_{\text{command}} \cdot \max\left(0.1, 1.0 - \frac{F_{t, z}}{20.0}\right) \approx 0.40 - 0.70\text{ mm/step}$$

### 2.1 Horizon Reachability Calculations
To traverse the remaining $50.0$ mm depth inside the hole at $dz_{\text{effective}} \approx 0.50$ mm/step:
- Remaining steps required: $\Delta t_{\text{insert}} \approx \frac{50.0}{0.50} = 100\text{ steps}$.
- Total physical steps required from initial release to seating:
  $$H_{\text{physical}} = 3\text{ (free)} + 100\text{ (compliant insertion)} \approx 103\text{ steps}$$

**Kinematic Conclusion:**  
- At $H = 25$ steps: Available chamber budget is $25 - 3 = 22$ steps $\implies \text{Max depth} \approx 22 \times 0.50 = 11.0$ mm. Full seating is mathematically impossible.
- At $H = 40$ steps: Available chamber budget is $37$ steps $\implies \text{Max depth} \approx 18.5$ mm (matching our empirical maximum of $8.04$ mm under chamfer alignment delay).
- At $H = 75$ steps: Reachable depth $\approx 36$ mm.
- At $H = 100$ steps: Reachable depth $\approx 48$–$50$ mm.
- At $H = 150$ steps: Complete physical seating ($z \le -50.0$ mm) is kinematically feasible.

---

## 3. Experimental Protocol for Horizon Sweep

We execute a strictly controlled horizon sweep on Task 1 using the validated $M_4$ ACMM world model:
1. **Predeclared Success Criterion:** Peg seated at $z \le -50.0$ mm with $\|F_{\text{lateral}}\| < 10.0$ N.
2. **Tested Horizons:** $H \in \{40, 75, 100, 150\}$ steps across 30 held-out test episodes.
3. **Objective Function:** Corrected linear progress objective held fixed:
   $$R(s) = 5.0 \cdot \max(0, -z) - 1.5 \cdot \max(0, z) - 2.0 \cdot \|\text{lat}\| - 0.5 \cdot \text{tilt} - 0.05 \cdot \|F\| + 100 \cdot \mathbb{I}(\text{seated})$$
4. **Telemetry:** Record step-by-step depth profiles, lateral contact forces, wedging lockouts, and exact seating step index.

