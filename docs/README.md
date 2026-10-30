# CinePulse — Documentation

The complete project documentation set: from requirements to production operations.

> **All project management happens in [Notion](https://app.notion.com/p/40880c5f7ed58170bca1efda4e894ce9).** This `docs/` directory is technical documentation for the code, not a tracker.

## Project management — Notion

Everything related to planning and work status lives only in Notion and is not duplicated in the repo:

| What | Where in Notion |
|----|-------------|
| Roadmap, stage status, page catalog | [Roadmap](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb) |
| Epics (Now / Next / Later) | "Epics" database on the roadmap page |
| Tasks, priorities, statuses | "Tasks" database |
| Links, access, where secrets are stored | "Resources and access" page |

Workflow:

1. A task is taken from the "Tasks" database ("Next steps" view) and moved to *In Progress*.
2. Commits carry the task number: `CIN-<number>: <description>` (number = task ID in Notion).
3. When finished, the task → *Done*, with commit hashes in the "Commits" field.
4. A new architectural decision → an ADR (in Notion and in [`03-architecture/decisions/`](./03-architecture/decisions/)).

## Structure

| Section | Document | About |
|--------|----------|--------|
| **01 · Product** | [PRD](./01-product/PRD.md) · [GLOSSARY](./01-product/GLOSSARY.md) | Requirements, goals, personas, terminology |
| **02 · Design** | [UX_NOTES](./02-design/UX_NOTES.md) | Design system, theme, UI states, a11y |
| **03 · Architecture** | [ARCHITECTURE](./03-architecture/ARCHITECTURE.md) · [DATA_MODEL](./03-architecture/DATA_MODEL.md) · [API_SPEC](./03-architecture/API_SPEC.md) · [ADR](./03-architecture/decisions/) | MFE, monorepo, data, API, decisions |
| **04 · Development** | [SETUP](./04-development/SETUP.md) · [CONVENTIONS](./04-development/CONVENTIONS.md) | Local setup, code conventions |
| **05 · Testing** | [TEST_STRATEGY](./05-testing/TEST_STRATEGY.md) | Test pyramid, tools, goals |
| **06 · Deployment** | [CI_CD](./06-deployment/CI_CD.md) · [ENVIRONMENTS](./06-deployment/ENVIRONMENTS.md) | Pipeline, environments |
| **07 · Operations** | [RUNBOOK](./07-operations/RUNBOOK.md) · [MONITORING](./07-operations/MONITORING.md) | Incidents, monitoring |

## How to use

- **What is done and what is next? The state of each page?** → [Roadmap in Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb).
- **Run locally?** → [SETUP](./04-development/SETUP.md).
- **Every document 01–07** starts with a link to the roadmap in Notion.

## Status legend

✅ done · 🟡 in progress / partial · ⬜ not started · ⚠️ needs product owner input (data/decisions outside the code)
