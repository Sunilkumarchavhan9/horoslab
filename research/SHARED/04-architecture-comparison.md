# HOROS First-Party Model Program: SHARED
## 04 — Architecture Comparison & Backbone Selection

### 1. Evaluated Foundation Backbone Architectures

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Option A: Dense Monolithic Transformer                                      │
│ Single massive dense model trained simultaneously across all physical tasks │
└─────────────────────────────────────────────────────────────────────────────┘
  ❌ Negative Transfer: Robotic motor gradients interfere with CFD shock gradients.
  ❌ Compute Inefficiency: High inference cost for real-time edge robotics.

┌─────────────────────────────────────────────────────────────────────────────┐
│ Option B: Disjoint Independent Models per Domain                            │
│ Completely separate models for PROBE-1 and AEROPROBE-1                      │
└─────────────────────────────────────────────────────────────────────────────┘
  ⚠️ Zero Synergies: No shared spatial representation or geometric transfer.
  ⚠️ Engineering Duplication: Fragmented infra, duplicate compilers, double maintenance.

┌─────────────────────────────────────────────────────────────────────────────┐
│ Option C (Selected for HOROS SHARED):                                       │
│ Sparse Mixture-of-Experts with Shared Geometric Foundation Trunk            │
│ (HOROS-Core Trunk + Domain Specialized Experts)                             │
│                                                                             │
│                    [Universal Input Ingestion Layer]                        │
│          (Images, 3D Point Clouds, Proprioception, Flight States)           │
│                                   │                                         │
│                                   ▼                                         │
│                [HOROS-Core Shared Spatial-Temporal Trunk]                   │
│          (Pretrained on 3D Geometry, Motion, and Field Dynamics)           │
│                                   │                                         │
│                   ┌───────────────┴───────────────┐                         │
│                   ▼                               ▼                         │
│       [Expert Group 1: PROBE-1]       [Expert Group 2: AEROPROBE-1]         │
│       - Contact Dynamics              - Compressible Aerodynamics           │
│       - Slip & Friction Prediction    - Transonic Shock Capturing           │
│       - 100 Hz Action Flow            - 3D Pressure / Velocity Fields       │
│                   │                               │                         │
│                   ▼                               ▼                         │
│       [Robotics Actuator Output]      [Aerodynamic Force & Field Output]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Selection Rationale
Option C (Sparse MoE with Shared Spatial Trunk) allows HOROS to train a massive shared geometric and temporal representation across thousands of GPU hours while isolating gradient updates in domain-specific expert routing layers. This prevents negative transfer while maximizing shared physical representation transfer.
