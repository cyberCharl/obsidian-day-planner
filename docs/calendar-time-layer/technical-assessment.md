# Technical Assessment

## Summary

The inherited plugin already has useful rendering and gesture infrastructure, but its storage and edit pipeline is still built around task markdown.

For the calendar/time-layer MVP, the best vertical slice is:

- preserve the existing timeline and multi-day rendering shell where practical
- preserve remote calendar event handling
- preserve the unscheduled task list as an attachment source
- bypass the markdown timestamp planner path for timed blocks
- introduce a plugin-owned per-day time file as the canonical source for planned and actual blocks

## What the current fork already does well

- `src/ui/components/timeline.svelte` already renders separate planner and tracker columns.
- `src/ui/hooks/use-edit/` already provides drag, resize, and create interactions for time blocks.
- `src/ui/multi-day-view.ts` and related components already provide a usable multi-day shell.
- `src/service/periodic-notes.ts` already gives a clean daily-note bridge.

These are reusable and worth keeping.

## Current blockers

### Planned time is task-markdown-shaped

Planned blocks currently come from Dataview tasks whose first line contains a timestamp.

That creates several problems for the target UX:

- blocks are implicitly task rows instead of explicit time containers
- parsing depends on line prose and timestamp conventions
- moving a block rewrites task text in daily notes
- there is no clean place for block-level metadata such as firmness, task references, or reconciliation fields

### Actual time is scattered across task props

Actual time currently comes from task-level YAML props (`planner.log`) indexed across vault files.

That is useful for task clocking, but it is not a good canonical time layer because:

- the store is fragmented across unrelated task files
- actual records are tied to task ownership instead of day ownership
- planned vs actual remain structurally asymmetric
- an external agent would need to mutate arbitrary task files rather than one stable day surface

## MVP storage decision

Use a plugin-owned markdown file per day under:

- `Day Planner/Time/YYYY-MM-DD.md`

Each file should contain:

- frontmatter identifying the file as a day-planner time layer file
- a `## Planned` section
- a `## Actual` section
- one bullet per block with explicit inline fields for machine-safe mutation

Why this shape:

- vault-native and visible
- simple for an external agent to read and write
- Dataview-friendly
- one file per day keeps the unit of reconciliation small
- planned and actual live side by side while remaining separate

## MVP implications

### Planned lane

The planner column should render planned blocks from the day time file, not from timestamped task lines.

### Actual lane

The tracker column should render actual blocks from the same day time file, not only from task log props.

### Tasks remain external truth

The unscheduled task list can remain sourced from Dataview. Dragging a task into the planner should create a planned block that references the task, not rewrite the task into a timed planner row.

### Daily note integration

The daily note should remain the user’s narrative surface. The MVP should add a minimal actual-time visibility path by linking or embedding the per-day time file from the daily note instead of duplicating the canonical data.

## Temporary compromises acceptable for MVP

- hard-code the time-layer folder path instead of exposing settings immediately
- store task references as lightweight file/line references before designing richer IDs
- keep legacy task-prop clocking code in place while the new time layer ships alongside it
- keep visual styling changes modest while prioritizing the storage + read/write + render slice
