# Time File Format

## Current MVP path

The MVP uses one plugin-owned markdown file per day:

- `Day Planner/Time/YYYY-MM-DD.md`

This file is the canonical storage surface for:

- planned blocks
- actual blocks

Tasks remain external and may be attached to blocks by reference.

## Why markdown

The current format is intentionally:

- vault-native
- readable without the plugin
- writable by an external agent without UI automation
- queryable by Dataview

## File shape

Each file contains:

1. frontmatter identifying it as a day-planner time file
2. a `## Planned` section
3. a `## Actual` section

Example:

```md
---
type: day-planner-time
day: 2026-05-03
version: 1
description: "Planner-managed planned and actual time blocks for 2026-05-03."
---

# 2026-05-03 Time

## Planned

- Deep work [id::planned-1] [start::2026-05-03T09:00:00+02:00] [end::2026-05-03T11:00:00+02:00] [status::firm] [task-path::Projects/Alpha.md] [task-line::14]

## Actual

- Deep work [id::actual-1] [start::2026-05-03T09:10:00+02:00] [end::2026-05-03T10:55:00+02:00] [planned::planned-1]
```

## Field meaning

### Common

- `id` — stable block identifier within the day file
- `start` — ISO timestamp with offset
- `end` — ISO timestamp with offset, omitted for an open actual block

### Planned-only

- `status` — currently `firm` or `tentative`
- `task-path` — optional source task path
- `task-line` — optional source task line number

### Actual-only

- `planned` — optional reference to the planned block this actual block relates to

## Current constraints

These are deliberate MVP compromises:

- blocks are single-line markdown bullets
- task references are file-and-line based, not stable task IDs
- block ordering is rewritten by start time
- the folder path is currently hard-coded
- richer reconciliation fields are deferred

## Daily-note bridge

The daily note integration does not duplicate the canonical data.

Instead, the plugin can add:

```md
## Actual Time

![[Day Planner/Time/YYYY-MM-DD.md#Actual]]
```

That keeps daily notes visible and useful without turning them back into the primary time store.
