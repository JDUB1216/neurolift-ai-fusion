# NLT Developer Guide: OTOI Framework

**NeuroLift Technologies (NLT) — Orchestrated Terms of Interaction (OTOI)**

> This document is the public-facing developer reference for the OTOI framework.
> Authoritative source: `NeuroLift-Technologies/.github-private` (synced via `sync-governance-public.yml`).

---

## What Is OTOI?

**OTOI** (Orchestrated Terms of Interaction) is the governance layer that controls how all AI agents within the NeuroLift ecosystem interact with each other, with human operators, and with external systems. Every agent, workflow, and integration must comply with OTOI.

**Full name:** TOI-OTOI = *Terms of Interaction — Orchestrated Terms of Interaction*

OTOI answers:
- **Who** can initiate which actions?
- **What** data can be shared between agents?
- **When** must a human approve or be notified?
- **How** are disputes and uncertainties escalated?

---

## Core Principles

| Principle | Requirement |
|---|---|
| **Privacy-first** | Data is ephemeral by default; persistence requires explicit human approval |
| **Human agency** | All strategic decisions require human initiation or approval |
| **Interruptibility** | Any agent can be paused or redirected at any time by a human |
| **Advisory-only authority** | Agents recommend; humans decide |
| **Transparent reasoning** | Every agent output includes human-readable reasoning |
| **Selective context sharing** | Agents share only the minimum necessary context |

---

## Configuration Reference

### Global Config — `config/global-toi-config.json`

The single source of truth for OTOI settings applied to every agent in the system.

```json
{
  "otoi": {
    "version": "1.2.0",
    "global_settings": {
      "privacy": {
        "data_retention": "ephemeral",
        "override_rights": "human-controlled",
        "context_window": "adaptive"
      },
      "agency": {
        "task_initiation": "human-approved",
        "interruptibility": "always",
        "decision_authority": "advisory-only"
      },
      "cognitive_alignment": {
        "scaffolding_style": "modular",
        "threading": "parallel-preserving",
        "context_sharing": "selective"
      }
    }
  }
}
```

### Per-Agent Config — `toi-profile.json`

Every agent directory **must** include a `toi-profile.json`. Required fields:

| Field | Type | Description |
|---|---|---|
| `agent_id` | string | Unique identifier for this agent |
| `privacy.data_retention` | enum | `ephemeral` \| `session` \| `persistent` |
| `agency.autonomy_level` | enum | `advisory` \| `semi-autonomous` \| `autonomous` |
| `agency.approval_required` | string[] | Actions that need human sign-off |
| `cognitive_style.scaffolding` | enum | `modular` \| `linear` \| `adaptive` |
| `escalation.triggers` | string[] | Conditions that invoke the escalation protocol |

**Minimal example:**

```json
{
  "agent_id": "cfo-agent",
  "privacy": {
    "data_retention": "ephemeral",
    "shareable_with": ["CEO", "COO", "CFO_Agent"]
  },
  "agency": {
    "autonomy_level": "advisory",
    "approval_required": ["financial_commitments", "vendor_contracts"],
    "interruptible": true
  },
  "cognitive_style": {
    "scaffolding": "modular",
    "output_format": "structured_report"
  },
  "escalation": {
    "triggers": ["conflicting_recommendations", "decision_uncertainty", "ethical_concerns"],
    "route_to": "CEO"
  }
}
```

---

## Human Oversight Matrix

### CEO

| Category | Action Required |
|---|---|
| Strategic decisions | **Approval** |
| Financial commitments above threshold | **Approval** |
| Partnership agreements | **Approval** |
| Major policy changes | **Approval** |
| All agent outputs | **Notification** |
| Escalated issues | **Notification** |
| Performance metrics | **Notification** |

### COO

| Category | Action Required |
|---|---|
| Operational changes | **Approval** |
| Resource allocation | **Approval** |
| Process modifications | **Approval** |
| Vendor selection | **Approval** |
| Department outputs | **Notification** |
| Operational metrics | **Notification** |
| Escalation events | **Notification** |

---

## Inter-Agent Communication Protocol

All agent-to-agent messages **must** follow this structure:

```json
{
  "message_id": "<uuid>",
  "from_agent": "<agent_id>",
  "to_agent": "<agent_id | human>",
  "timestamp": "<ISO-8601>",
  "payload": { },
  "requires_approval": false,
  "reasoning": "<human-readable explanation>"
}
```

### Context Sharing Rules

| From → To | Allowed Scope |
|---|---|
| Executive ↔ Executive | Full context |
| Department → Parent Executive | Comprehensive reporting |
| Department ↔ Department | Relevant information only |
| Any Agent → Human | Summarized; full detail available on request |

---

## Escalation Protocol

An agent **must** escalate when any of the following triggers fire:

1. Conflicting recommendations between two or more agents
2. Decision uncertainty beyond the agent's capability
3. Resource conflicts requiring human arbitration
4. Ethical concerns or policy violations
5. Capability limitations requiring human expertise

### Escalation Routing

| Issue Type | Routes To |
|---|---|
| Strategic | CEO |
| Operational | COO |
| Technical | CTO Agent |
| Financial | CFO Agent |
| Marketing/Brand | CMO Agent |

---

## Data Retention Policies

| Level | When To Use | Requires Human Approval? |
|---|---|---|
| `ephemeral` | All conversations by default | No |
| `session` | Ongoing projects requiring cross-turn context | No (within session) |
| `persistent` | Critical business records | **Yes** |

---

## Developer Implementation Checklist

When building a new agent or integrating an existing system into NLT:

- [ ] Create `toi-profile.json` in the agent directory
- [ ] Reference `config/global-toi-config.json` — do **not** override global privacy settings locally
- [ ] All agent outputs include a `reasoning` field (human-readable)
- [ ] All escalation triggers are configured and tested
- [ ] Human approval gates are implemented for every action listed in `approval_required`
- [ ] Agent is interruptible: responds to pause/redirect signals within one processing cycle
- [ ] Context sharing limited to the scope defined in `shareable_with`
- [ ] Audit log entries emitted for every decision and escalation
- [ ] `toi-profile.json` version matches the global OTOI version (`1.2.0` or later)

---

## Privacy Override Mechanisms

Humans retain the following override rights at all times:

| Override | Effect |
|---|---|
| **Immediate stop** | Agent halts current action and awaits instruction |
| **Data deletion** | All stored context for a session/record is purged |
| **Context isolation** | Agent stops sharing context with specified peers |
| **Decision reversal** | Agent's last recommendation is withdrawn and logged |

---

## Versioning and Updates

| Field | Value |
|---|---|
| OTOI Version | `1.2.0` |
| Last Updated | April 2026 |
| Maintained in | `NeuroLift-Technologies/.github-private` |
| Synced to public via | `.github/workflows/sync-governance-public.yml` |

To propose changes to OTOI governance:
1. Open an issue in `NeuroLift-Technologies/.github-private`
2. Tag `@JDUB1216` for CEO review
3. After approval, the `sync-governance-public.yml` workflow publishes the update here

---

## Related Documents

| Document | Location | Description |
|---|---|---|
| `TOI-OTOI-INTEGRATION.md` | Repo root | Framework overview and philosophy |
| `global-toi-config.json` | `config/` | Machine-readable global settings |
| `toi-profile.json` | Each agent dir | Per-agent OTOI compliance profile |
| `docs/architecture.md` | `docs/` | System architecture overview |

---

*Maintained by Joshua Dorsey · NeuroLift Technologies · neuroliftsolutions.com*
