# NeuroLift AI Fusion — Web Dashboard TODO

## Database & Backend
- [x] Extend drizzle/schema.ts with avatars, aides, training_sessions, task_results, coaching_actions, burnout_assessments, metrics tables
- [x] Generate and apply DB migration SQL (TiDB-compatible, manual migration script)
- [x] Add query helpers in server/db.ts for all entities
- [x] Add tRPC routers: avatars, aides, sessions, fusion, burnout, analytics, dashboard
- [x] Seed demo data for development (scripts/seed-demo.mjs)
- [x] Role-based access: admin sees all, user sees own data

## Global Theme & Layout
- [x] Design elegant dark theme with refined OKLCH color palette in index.css
- [x] Build DashboardLayout with collapsible sidebar (mobile-responsive)
- [x] Sidebar navigation: Dashboard, Training Sessions, Avatars, Aides, Fusion Engine, Burnout Monitor, Analytics
- [x] Top header with user profile, role badge, and logout
- [x] Mobile hamburger menu and drawer for sidebar on small screens

## Dashboard Home (Page 1)
- [x] Overview stats cards: active sessions, fusion-ready pairs, high burnout risk count
- [x] Active training sessions live list with status badges
- [x] Fusion readiness summary table
- [x] Burnout risk indicator panel

## Avatar Management (Page 2)
- [x] Avatar list with trait name, emotional state, cognitive load, stress level, independence level
- [x] Avatar detail panel with full profile
- [x] Create avatar form (admin only)
- [x] Status badges and progress bars for key metrics

## Aide Management (Page 3)
- [x] Aide list with expertise area, coaching strategies, effectiveness metrics
- [x] Aide detail panel
- [x] Create aide form (admin only)

## Fusion Engine (Page 4)
- [x] Fusion readiness assessment UI across all dimensions
- [x] Trigger fusion process button with confirmation
- [x] Fusion history list with results
- [x] Readiness dimension radar chart (recharts RadarChart)

## Training Sessions (Page 5)
- [x] Session list with real-time status updates (live timer for active sessions)
- [x] Start new session form (select avatar + aide + scenario)
- [x] End/pause/resume session actions
- [x] Session status badges and duration display
- [x] Filter tabs: all / active / completed / paused / failed

## Session Detail (Page 6)
- [x] Task results list with success/failure, quality scores, struggle indicators
- [x] Coaching actions timeline with type, urgency, effectiveness
- [x] Session summary stats (tasks, quality, coaching, duration)
- [x] Task quality bar chart and coaching distribution chart

## Burnout Monitoring (Page 7)
- [x] Burnout assessment cards per avatar with risk scores and risk levels
- [x] Historical trend line chart per avatar (recharts LineChart)
- [x] Risk level color coding (low/medium/high/critical)
- [x] Recommendations panel for selected avatar

## Progress Analytics (Page 8)
- [x] Learning progress area chart: metric trends over time
- [x] Session quality scores bar chart
- [x] Task success rate and independence level bar chart
- [x] Avatar performance summary table

## Auth & Access Control
- [x] Protected routes requiring login
- [x] Admin/owner role gates on management actions (create buttons)
- [x] Role badge in sidebar/header
- [x] Redirect unauthenticated users to login

## Testing
- [x] Vitest tests for all tRPC procedures (23 tests in neurolift.test.ts)
- [x] Auth guard tests (unauthenticated access throws)
- [x] Logout cookie test (auth.logout.test.ts)
- [x] All 24 tests passing

## Repository Cleanup
- [x] Archived: wordpress/, business-structure/, nlt-business-agents/, cloudflare/, orphaned configs, root markdown files
- [x] ARCHIVE-README.md documenting what was moved and why
