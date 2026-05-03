<script lang="ts">
  import { Link } from "lucide-svelte";
  import { fromStore } from "svelte/store";
  import { isNotVoid } from "typed-assert";

  import { getObsidianContext } from "../../context/obsidian-context";
  import type { LocalTask } from "../../task-types";
  import { createTimeBlockMenu } from "../time-block-menu";

  import BlockList from "./block-list.svelte";
  import LocalTimeBlock from "./local-time-block.svelte";
  import Pill from "./pill.svelte";
  import Properties from "./Properties.svelte";
  import Selectable from "./selectable.svelte";

  const { workspaceFacade, timeLayer } = getObsidianContext();
  const recentLogRecords = fromStore(timeLayer.recentActualTasks);

  function revealAttachedTask(task: LocalTask) {
    const taskRef = task.timeLayer?.taskRef;

    isNotVoid(taskRef, "Attached task reference is missing");

    return workspaceFacade.revealLineInFile(taskRef.path, taskRef.line);
  }
</script>

<BlockList list={recentLogRecords.current}>
  {#snippet match(task: LocalTask)}
    <Selectable
      onSecondarySelect={(event) =>
        createTimeBlockMenu({ event, task, workspaceFacade, timeLayer })}
    >
      {#snippet children({ use, onpointerup, state })}
        <LocalTimeBlock
          isActive={state === "secondary"}
          {onpointerup}
          {task}
          {use}
        >
          {#snippet bottomDecoration()}
            <Properties>
              {#if task.timeLayer?.taskRef}
                <Pill
                  key={Link}
                  onpointerup={() => revealAttachedTask(task)}
                  value={task.timeLayer.taskRef.path.replace(/\.md$/, "")}
                />
              {/if}
            </Properties>
          {/snippet}
        </LocalTimeBlock>
      {/snippet}
    </Selectable>
  {/snippet}
</BlockList>
