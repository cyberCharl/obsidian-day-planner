# Implementation Plan

## Goal

Use the existing Day Planner fork as an accelerator, but validate the architecture before any large UI rewrite.

## Phase 1: Fork assessment

Inspect what should be preserved vs replaced.

- View shells: `src/ui/timeline-view.ts`, `src/ui/multi-day-view.ts`
- Timeline components: `src/ui/components/timeline-with-controls.svelte`, `src/ui/components/timeline.svelte`
- Edit flows: `src/ui/hooks/use-edit/`
- Parser path: `src/parser/parser.ts`
- Tracking path: `src/feature/time-tracking-feature.ts`

Deliverable: a short technical note on which internals are reusable and which assumptions are blockers.

## Phase 2: Time-layer data model

Define the canonical representation before reshaping the UI too far.

Questions to settle:

- Will v1 continue using timestamped markdown lines as the source of planned blocks?
- Should actual blocks remain task-prop based, or move to a plugin-owned daily store?
- What is the minimal stable format an external agent can write safely?

Likely files to inspect:

- `src/task-types.ts`
- `src/types.ts`
- `src/util/props.ts`
- `src/service/list-props-parser.ts`

## Phase 3: Today and multi-day UX reshape

Reshape the user-facing loop once the storage model is defensible.

- single-day operational view
- week or multi-day planning view
- clearer separation between hard commitments, planned blocks, and actual time
- side-panel details/actions instead of metadata-heavy inline editing

Likely files to inspect:

- `src/ui/components/multi-day/`
- `src/ui/components/local-time-block.svelte`
- `src/ui/components/positioned-time-block.svelte`
- `src/ui/components/time-block-controls.svelte`

## Phase 4: Task attachment and completion

Attach tasks to blocks without making the plugin own task state.

- read task context
- attach task references to blocks
- complete tasks from the planner
- preserve existing Tasks plugin semantics where possible

Likely files to inspect:

- `src/tasks-plugin.ts`
- `src/util/get-tasks-for-day.ts`
- `src/ui/hooks/use-tasks.ts`
- `src/service/task-entry-editor.ts`

## Phase 5: BYO-agent surfaces

Only after the data model is stable.

- define safe read/write surfaces
- document what an external agent can mutate
- avoid UI-only state that forces brittle automation

This phase is explicitly about plugin affordances, not shipping an embedded AI feature.

## Phase 6: Reconciliation loop

Close the day cleanly.

- compare plan vs actual
- capture missed or moved blocks
- prepare tomorrow from evidence

The v1 bar is modest: the user should be able to recover the day, not produce perfect analytics.
