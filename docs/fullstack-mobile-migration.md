# Full-Stack + Mobile Migration Plan

## Objective
Evolve the current simulation environment into a production-ready platform delivered through:

1. Web application
2. Backend API
3. Mobile app for Android + iOS

## Current baseline
- Python simulation engine exists in `src/`
- Automated tests exist in `tests/`
- Supabase migration baseline exists in `supabase/migrations/`

## Phased plan

### Phase 1 — API foundation
- Create `packages/api` TypeScript service
- Add auth, user, and simulation session APIs
- Define typed contracts in `packages/shared`

### Phase 2 — Web product
- Build `apps/web` dashboard and session experience
- Integrate auth and data visualizations
- Support simulation lifecycle operations

### Phase 3 — Mobile product (Android + iOS)
- Build `apps/mobile` with shared contracts
- Implement check-ins, interventions, and notifications
- Keep parity for core session status and history

### Phase 4 — Simulation integration hardening
- Expose Python simulation engine behind stable API boundaries
- Add job orchestration for long-running simulation tasks
- Add observability and production-grade error handling

## Cleanup completed in this change
- Archived legacy/non-core directories to `archive/legacy-content/`
- Established explicit app/package scaffolding for web/mobile/backend/shared
