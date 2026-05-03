# Calendar and Time Layer

This folder adapts NeoArtemis planning notes into fork-specific documentation for `obsidian-day-planner`.

The branch now has an active MVP implementation in progress. These docs still capture product direction, but they also need to stay aligned with the storage model and UI slice that now exists in code.

## Fork framing

- Base: `ivan-lednev/obsidian-day-planner`
- Intent: reshape the plugin into a stronger day-planning and reconciliation surface
- Constraint: preserve upstream code integrity until the data model and UI seams are understood

## BYO-agent model

This fork assumes an external agent may be a primary operator, but the plugin must not bundle one specific agent, vendor, or runtime.

- The plugin owns stable views, storage, and mutation surfaces.
- An external agent may prepare blocks, log actual time, draft briefings, or reconcile the day.
- "Agent-assisted" in these docs means "supported by explicit plugin surfaces," not "hard-coded AI feature."

## Current architecture anchors

These files are the main starting points for implementation work:

- `src/ui/timeline-view.ts` wires the single-day sidebar view.
- `src/ui/multi-day-view.ts` wires the multi-day planner shell.
- `src/ui/components/timeline-with-controls.svelte` is the main timeline entry component.
- `src/parser/parser.ts` extracts time blocks from markdown task lines.
- `src/feature/time-tracking-feature.ts` indexes time-tracking data across markdown files.
- `src/service/task-entry-editor.ts` mutates task props for clock in/out flows.
- `src/tasks-plugin.ts` is the integration boundary with the Tasks plugin API.
- `src/service/time-layer-service.ts` is the plugin-owned day-file storage and mutation layer for the MVP.

## Documents

- `product-spec.md` defines the desired v1 behavior for the fork.
- `implementation-plan.md` breaks the work into repo-specific phases.
- `ux-loop.md` describes the intended day-planning interaction loop.
- `first-principles.md` records the underlying requirements and system split.
- `HANDOFF.md` gives the next implementer a concrete starting point.
- `technical-assessment.md` explains why the MVP moved to a plugin-owned per-day time file.
- `time-file-format.md` documents the concrete markdown format currently written by the plugin.
