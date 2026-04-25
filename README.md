# NeuroLift AI Fusion

**AI-powered ADHD coaching and simulation platform — full-stack web app + Android & iOS.**

> "Nothing About Us Without Us" — neurodivergent voices lead development.

---

## What is this?

NeuroLift is a Sims/RPG-style simulation where AI Avatars with ADHD traits experience authentic life scenarios while AI Aides provide real-time coaching. Advocates then fuse lived avatar experience with aide expertise to generate personalised insights.

---

## Monorepo structure

```
neurolift-ai-fusion/
├── apps/
│   ├── web/          # Next.js 14 full-stack web app (TypeScript + Tailwind)
│   ├── api/          # FastAPI backend — exposes simulation engine as REST API
│   └── mobile/       # React Native app (Android + iOS, TypeScript)
├── packages/
│   └── core/         # Python simulation engine (avatars, aides, advocates, world)
├── supabase/         # Database migrations (Postgres via Supabase)
├── config/           # Shared configuration (simulation, training, global)
├── data/             # Data templates
├── tests/            # Python test suite for core package
├── docs/             # Architecture & implementation documentation
└── archive/          # Legacy code preserved for reference
```

---

## Quick start

### Prerequisites

- Node.js 20+
- Python 3.11+
- (Android) Android Studio + SDK
- (iOS) Xcode 15+ (macOS only)

### Web app

```bash
cd apps/web
cp .env.example .env.local   # fill in Supabase credentials
npm install
npm run dev                  # http://localhost:3000
```

### API server

```bash
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload    # http://localhost:8000
# Swagger docs: http://localhost:8000/docs
```

### Mobile app

```bash
cd apps/mobile
npm install

# Android
npx react-native run-android

# iOS (macOS only)
cd ios && pod install && cd ..
npx react-native run-ios
```

### Run all (from root)

```bash
npm run api      # start FastAPI
npm run web      # start Next.js dev server
npm run mobile   # start Metro bundler
```

---

## Architecture

```
Browser / iOS / Android
        │
        ▼
   apps/web  ──┐
   apps/mobile ─┤──► apps/api (FastAPI REST)
                │           │
                │           ▼
                │    packages/core (Python simulation engine)
                │           │
                │           ▼
                └──────► Supabase (Postgres + Auth + Storage)
```

### Core simulation concepts

| Component | Role |
|-----------|------|
| **Avatar** | Embodies ADHD traits, experiences scenarios, accumulates lived knowledge |
| **Aide** | Real-time AI coach with expertise in attention & executive function |
| **Advocate** | Fuses avatar experience + aide expertise into personalised guidance |
| **World Engine** | Manages scenario progression, NPC interactions, and state |

---

## Environment variables

See `.env.example` files in each app:

| App | File |
|-----|------|
| `apps/web` | `apps/web/.env.example` |
| `apps/api` | `apps/api/.env.example` |

---

## Contributing

1. Branch off `master` — feature branches named `feature/<short-description>`
2. Run `npm run type-check` and `pytest tests/` before opening a PR
3. Open PRs against `master`

---

## License

MIT — see [LICENSE](LICENSE)
