# Implementer Handoff

## Current repo state

- Local repo path: `/Users/charlbotha/repos/cyberCharl/obsidian-day-planner`
- Branch: `main`
- Fork remote: `origin`
- Upstream remote: `upstream`

## What was added

This doc set was imported from NeoArtemis session notes and adapted to this fork:

- `docs/calendar-time-layer/README.md`
- `docs/calendar-time-layer/product-spec.md`
- `docs/calendar-time-layer/implementation-plan.md`
- `docs/calendar-time-layer/ux-loop.md`
- `docs/calendar-time-layer/first-principles.md`
- `docs/calendar-time-layer/HANDOFF.md`

The docs are intentionally fork-scoped and make the BYO-agent distinction explicit.

## Recommended next files to inspect

- `src/ui/timeline-view.ts` to understand the single-day view shell.
- `src/ui/multi-day-view.ts` to understand the existing multi-day entry point.
- `src/ui/components/timeline-with-controls.svelte` for the main timeline composition.
- `src/ui/components/timeline.svelte` for current rendering assumptions.
- `src/parser/parser.ts` for planned-block parsing assumptions.
- `src/feature/time-tracking-feature.ts` for actual-time indexing behavior.
- `src/service/task-entry-editor.ts` for clock mutation behavior.
- `src/tasks-plugin.ts` for the current Tasks API boundary.

## Recommended first implementation step

Write a short technical assessment before changing product behavior:

1. List which current data paths already support the desired split between planned time and actual time.
2. Identify where markdown timestamp parsing becomes a blocker.
3. Decide whether v1 should extend the current markdown model or introduce a plugin-owned daily time store.

Do not start with AI features or broad calendar-sync work. The first hard decision is the time-layer data model.
