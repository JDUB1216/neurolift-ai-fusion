# NeuroLift AI Fusion

NeuroLift AI Fusion is an ADHD-focused simulation and coaching platform that is now organized as a **full-stack product**:

- **Web app** for dashboarding, simulation control, and insights
- **API backend** for orchestration, persistence, and integrations
- **Mobile app (Android + iOS)** for on-the-go coaching and session tracking
- **Python simulation engine** for Avatar/Aide/Advocate training loops

## Repository Cleanup (April 2026)

To keep the product repo focused on simulation + product delivery, legacy business-documentation content was moved to archive paths:

- `archive/legacy-content/nlt-business-agents/`
- `archive/legacy-content/wordpress/`

## Monorepo Layout

```text
neurolift-ai-fusion/
├── apps/
│   ├── web/                  # Full-stack web frontend (Next.js-ready scaffold)
│   └── mobile/               # Android + iOS app (React Native/Expo-ready scaffold)
├── packages/
│   ├── api/                  # API service scaffold for web/mobile backends
│   └── shared/               # Shared schemas/types/contracts
├── src/                      # Existing Python simulation engine
├── scripts/                  # Python utility scripts and runners
├── tests/                    # Python test suite
├── archive/                  # Archived/legacy content
└── docs/                     # Architecture, migration and implementation docs
```

## Quick Start (Simulation Engine)

```bash
pip install -r requirements.txt
python scripts/setup_environment.py
python scripts/run_training_session.py --avatar stay_alert --scenarios workplace.meeting_dynamics
```

## Full-Stack Transition Plan

See:

- `docs/fullstack-mobile-migration.md`
- `apps/web/README.md`
- `apps/mobile/README.md`
- `packages/api/README.md`

## Vision

The Avatar-Aide-Advocate simulation model remains the core differentiator. The full-stack + mobile architecture makes that engine usable as a real product across browser, Android, and iOS.
