# Product Spec

## Overview

This fork aims to turn Day Planner into a stronger calendar-first operational surface for:

- seeing the day
- shaping protected time
- logging what actually happened
- reconciling plan vs reality

It is not intended to become a second task database.

## Product split

- Task truth stays in the user's existing task layer.
- Time truth lives in the plugin's timeline and time-tracking model.
- Calendar events, planned blocks, and actual blocks should be connected, but not collapsed into one object too early.

## BYO-agent requirement

The plugin should expose clear data and UI surfaces that an external agent can operate safely.

- No bundled proprietary agent behavior
- No assumption of one LLM provider
- No workflows that require screen scraping or unstable prose parsing

## Problems to solve

1. Existing commitments are too easy to miss or underweight.
2. Important work stays abstract instead of becoming protected time.
3. Replanning after disruption is too brittle.
4. Current plan-vs-reality feedback is weak.
5. Manual time tracking is too high-friction to sustain.

## v1 goals

1. Make today's shape visible immediately.
2. Support a small number of meaningful blocks instead of event spam.
3. Keep planned time and actual time distinct.
4. Allow tasks to attach to blocks without turning blocks into tasks.
5. Support a low-friction end-of-day reconciliation loop.

## v1 non-goals

1. Replacing the Tasks plugin or the user's task system
2. Full auto-scheduling
3. A full calendar sync engine redesign
4. Bundled AI automation
5. Rich analytics beyond basic reconciliation

## Current repo implications

The existing codebase suggests these constraints:

- `src/parser/parser.ts` currently assumes markdown lines with timestamps are the primary source of planned blocks.
- `src/feature/time-tracking-feature.ts` and `src/service/task-entry-editor.ts` already provide a foothold for actual-time capture through markdown props.
- `src/ui/timeline-view.ts` and `src/ui/multi-day-view.ts` are the current view shells to evolve rather than replace blindly.
- `src/tasks-plugin.ts` is the narrowest current integration point for task completion behavior.

## Desired v1 objects

The fork likely needs at least these concepts, even if upstream terminology differs:

- external events
- planned blocks
- actual blocks
- task references attached to blocks
- reconciliation state

The important rule is that a block is a time container, not a task.
