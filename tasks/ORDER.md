# Recommended implementation order

The order is intentionally backend-first around shared contracts. Frontend foundation can begin early, but feature integration should follow stable backend OpenAPI.

## Phase 0 - foundations

Backend: BE-001 -> BE-002 -> BE-003 -> BE-004 -> BE-005 -> BE-006 -> BE-007

Frontend: FE-001 -> FE-002 -> FE-003 -> FE-006

## Phase 1 - identity and access

Backend: BE-008 -> BE-009 -> BE-010 -> BE-011 -> BE-012 -> BE-019 -> BE-018

Frontend: FE-004 -> FE-005

Integration checkpoint: INT-001

## Phase 2 - core legal records

Backend: BE-013 -> BE-014 -> BE-015 -> BE-016 -> BE-017

Frontend: FE-007 -> FE-008 -> FE-009 -> FE-010 -> FE-011

Integration checkpoints: INT-002, INT-003

## Phase 3 - documents, realtime, notifications

Backend: BE-020 -> BE-021 -> BE-022 -> BE-023 -> BE-024 -> BE-035 -> BE-039 -> BE-040 -> BE-041 -> BE-042

Frontend: FE-012 -> FE-013 -> FE-015

Integration checkpoint: INT-004

## Phase 4 - dashboard, activity, offboarding , user managements

Backend: BE-025 -> BE-026 -> BE-036 -> BE-037 -> BE-038 -> BE-027

Frontend: FE-022 -> FE-023 -> FE-024 -> FE-014 -> FE-016 -> FE-017

Integration checkpoints: INT-005, INT-006

## Phase 5 - contract completion and hardening

Backend: BE-028 -> BE-029 -> BE-030 -> BE-031 -> BE-032 -> BE-033 -> BE-034

Frontend: FE-018 -> FE-019 -> FE-020 -> FE-021

Integration checkpoints: INT-007 -> INT-008

## Parallelism warnings

- Do not run two migration-producing backend tasks concurrently.
- Do not change OpenAPI and generated frontend types in parallel without coordination.
- Authentication, common base classes, permissions, and Matter schema are serial foundations.
- Keep Docker/Compose changes coordinated between BE-031 and FE-020.
