# Epoch Beta v2 Backlog

This backlog is intentionally separate from the beta-finish path.
Do not ship these items before the core mission loop is reliable end-to-end.

## Worker Registry

- Register software, simulated robot, and inspection workers as first-class runtime entities.
- Expose worker status, leases, and evidence ownership in Mission Control.

## Robot Worker (Simulation)

- Add a simulation-backed worker lane for non-destructive mission execution.
- Record simulated actions as evidence so the learning loop stays traceable.

## Inspection Institution

- Create an institution template for audit-style inspection missions.
- Make it reusable for software, physical, and hybrid verification flows.

## Reality Entities

- Promote software systems, devices, and operational surfaces into a shared reality graph.
- Keep entity identity, source, confidence, and lineage visible.

## Sensor Evidence

- Add evidence types for live signals, snapshots, logs, and structured sensor payloads.
- Keep evidence mapped to the mission, institution, and verification outcome.

## Institution Templates

- Expand the template library once the first mission loop is stable.
- Keep templates productized and reusable, not one-off consulting flows.

## Guardrail

- No new dashboard sections until one mission can travel through Planning -> Execution -> Evidence -> Verification -> Settlement -> Learning reliably.
