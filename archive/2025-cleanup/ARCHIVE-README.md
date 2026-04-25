# Archive — 2025 Cleanup

These files were moved here during the April 2025 repository cleanup. They are preserved for reference but are **not part of the core simulation engine or the full-stack application**.

## What Was Archived

| Item | Reason |
|---|---|
| `wordpress/` | WordPress theme — replaced by the React/FastAPI full-stack web app |
| `business-structure/` | Business org documentation — not simulation code |
| `nlt-business-agents/` | Business agent configs — operational docs, not application code |
| `cloudflare/` | Cloudflare Workers deployment configs — deployment concern, not core code |
| `BUILD-SUMMARY.md` | Historical build notes — superseded by updated README |
| `IMPLEMENTATION-COMPLETE.md` | Historical milestone doc |
| `NLT-DEV-OTOI.md` | Development notes |
| `TOI-OTOI-INTEGRATION.md` | Integration notes |
| `QUICKSTART.md` | Old quickstart — replaced by updated README |
| `azure-pipelines.yml` | Azure CI config — replaced by GitHub Actions |
| `package-lock.json` | Orphaned Node artifact (no corresponding package.json) |
| `global-toi-config.json` | Orphaned config file |

## How to Restore

To restore any archived item, simply move it back to the repo root or appropriate location:

```bash
mv archive/2025-cleanup/<item> ./<destination>
```
