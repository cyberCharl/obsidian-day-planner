# First Principles

## Why this fork exists

The upstream plugin already has three valuable ingredients:

- editable timeline views
- Tasks plugin integration
- basic time tracking

The fork direction is to make those ingredients support a stronger day-planning loop rather than treating the plugin as a generic event renderer.

## Design split

The clean split is:

- task systems answer "what"
- the calendar/time layer answers "when"

That means this fork should prioritize:

- temporal visibility
- protected time
- low-friction replanning
- plan-vs-reality feedback

It should avoid:

- becoming another canonical task store
- forcing tiny event-per-task scheduling
- coupling the product to one automation stack

## Behavioral requirement

The target workflow has to survive missed plans, interruptions, and restart-after-drift. A planner that only works on a perfect day is the wrong product.

## Repo implication

Because the current implementation is markdown- and task-centric, the biggest early design question is whether to extend those primitives or introduce a plugin-owned daily time model. That question should be settled before major UI work.
