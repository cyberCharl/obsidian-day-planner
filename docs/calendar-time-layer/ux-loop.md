# UX Loop

## Core framing

The primary surface should answer:

- what today is
- what today is becoming
- what actually happened

The planner is the day surface. The task system remains the task surface.

## 1. Morning orientation

The user opens the planner and should see:

- today's commitments
- today's protected blocks
- obvious open space
- current priorities linked from the task layer

The morning loop should be small:

1. scan the day
2. adjust a few blocks
3. commit to a realistic shape

## 2. Day shaping

Core interactions:

- move blocks
- resize blocks
- create blocks
- attach tasks to blocks
- distinguish tentative vs firm time

Critical rule: blocks are time containers, not task rows with timestamps.

## 3. In-day interaction

The planner should tolerate reality changes without punishing the user.

The user should be able to:

- re-orient quickly
- see current or next time blocks
- move slipped blocks
- record what actually happened

This is where the current time-tracking path matters. The fork already has clock flows; the question is how far they can be extended before a new storage model is needed.

## 4. End-of-day reconciliation

The user should be able to compare:

- planned blocks
- actual blocks
- unfinished attached tasks

This does not require heavy analytics in v1. It does require a clean review loop and a way to prepare tomorrow from today's evidence.

## BYO-agent interpretation

If an external agent is involved, its job is to operate this loop through explicit surfaces:

- suggest blocks
- prepare a briefing
- add actual-time records
- help reconcile the day

Those workflows should remain optional and external to the plugin core.
