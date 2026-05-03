<script lang="ts">
  import type { Moment } from "moment";
  import { get, fromStore } from "svelte/store";
  import { isNotVoid } from "typed-assert";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { isToday } from "../../global-store/current-time";
  import { getVisibleHours, snap } from "../../global-store/derived-settings";
  import { addHorizontalPlacing } from "../../overlap/overlap";
  import {
    getPointerOffsetY,
    isTouchEvent,
    offsetYToMinutes,
  } from "../../util/dom";
  import { minutesToMomentOfDay } from "../../util/moment";
  import { getBlockProps, getRenderKey } from "../../util/task-utils";
  import { createGestures } from "../actions/gestures";

  import Column from "./column.svelte";
  import LocalTimeBlock from "./local-time-block.svelte";
  import Needle from "./needle.svelte";
  import PositionedTimeBlock from "./positioned-time-block.svelte";
  import UnscheduledTimeBlock from "./unscheduled-time-block.svelte";

  const {
    day,
    isUnderCursor = false,
  }: { day: Moment; isUnderCursor?: boolean } = $props();

  const {
    settings,
    editContext: {
      confirmEdit,
      handlers: { handleContainerMouseDown },
      getDisplayedTasksForTimeline,
      editOperation,
    },
    pointerDateTime,
    settingsSignal,
    timeLayer,
  } = getObsidianContext();

  const displayedTasksForTimeline = $derived(getDisplayedTasksForTimeline(day));
  const actualTasks = fromStore(timeLayer.actualTasks);
  const actualTasksForDay = $derived(
    addHorizontalPlacing(
      actualTasks.current.filter((task) => task.startTime.isSame(day, "day")),
    ),
  );

  let el: HTMLElement | undefined = $state();

  function updatePointerDateTime(event: MouseEvent | TouchEvent) {
    isNotVoid(el);

    const newOffsetY = snap(getPointerOffsetY(el, event), $settings);
    const minutesSinceMidnight = offsetYToMinutes(
      newOffsetY,
      settingsSignal.current.zoomLevel,
      settingsSignal.current.startHour,
    );
    const dateTime = minutesToMomentOfDay(
      minutesSinceMidnight,
      window.moment(day),
    );
    const previousDateTime = get(pointerDateTime).dateTime;

    if (!dateTime.isSame(previousDateTime, "minute")) {
      pointerDateTime.set({ dateTime, type: "dateTime" });
    }
  }

  function handleContainerPointerDown(event: MouseEvent | TouchEvent) {
    updatePointerDateTime(event);
    handleContainerMouseDown();
  }

  function handleContainerPointerMove(event: MouseEvent | TouchEvent) {
    if (get(editOperation)) {
      updatePointerDateTime(event);
    }
  }

  const timelineGestures = createGestures({
    onlongpress: (event) => {
      if (event.target !== el) {
        return;
      }

      handleContainerPointerDown(event);
    },
    onpanmove: handleContainerPointerMove,
    onpanend: confirmEdit,
    options: { mouseSupport: false },
  });
</script>

{#if $settings.timelineColumns.planner}
  <Column visibleHours={getVisibleHours($settings)}>
    <div class="lane-label">Planned</div>

    {#if $isToday(day)}
      <Needle autoScrollBlocked={isUnderCursor} />
    {/if}

    <div
      bind:this={el}
      class="tasks absolute-stretch-x"
      onpointerdown={(event) => {
        if (isTouchEvent(event) || event.target !== el) {
          return;
        }

        handleContainerPointerDown(event);
      }}
      onpointermove={handleContainerPointerMove}
      onpointerup={confirmEdit}
      use:timelineGestures
    >
      {#each $displayedTasksForTimeline.withTime as task (getRenderKey(task))}
        <PositionedTimeBlock {task}>
          <UnscheduledTimeBlock {task}>
            {#snippet bottomDecoration()}
              {getBlockProps(task, settingsSignal.current)}
            {/snippet}
          </UnscheduledTimeBlock>
        </PositionedTimeBlock>
      {/each}
    </div>
  </Column>
{/if}

{#if $settings.timelineColumns.timeTracker}
  <Column visibleHours={getVisibleHours($settings)}>
    <div class="lane-label lane-label-actual">Actual</div>

    {#if $isToday(day)}
      <Needle autoScrollBlocked={isUnderCursor} showBall={false} />
    {/if}

    <div class="tasks absolute-stretch-x">
      {#each actualTasksForDay as task (task.id)}
        <PositionedTimeBlock {task}>
          <LocalTimeBlock {task}>
            {#snippet bottomDecoration()}
              {getBlockProps(task, settingsSignal.current)}
            {/snippet}
          </LocalTimeBlock>
        </PositionedTimeBlock>
      {/each}
    </div>
  </Column>
{/if}

<style>
  .tasks {
    top: 0;
    bottom: 0;

    display: flex;
    flex-direction: column;

    margin-inline: var(--size-4-2);
  }

  .lane-label {
    position: sticky;
    z-index: 2;
    top: 0;

    width: fit-content;
    margin: var(--size-2-1);
    padding: 0 var(--size-2-1);

    font-size: var(--font-ui-smaller);
    font-weight: var(--font-medium);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;

    background: color-mix(in srgb, var(--background-primary) 85%, transparent);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
  }

  .lane-label-actual {
    color: var(--color-accent);
  }
</style>
