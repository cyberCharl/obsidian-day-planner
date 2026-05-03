import type { Moment } from "moment";
import type { MetadataCache } from "obsidian";
import { derived, type Readable, type Writable } from "svelte/store";

import { DataviewFacade } from "../../service/dataview-facade";
import type { PeriodicNotes } from "../../service/periodic-notes";
import type { TimeLayerService } from "../../service/time-layer-service";
import { WorkspaceFacade } from "../../service/workspace-facade";
import type { DayPlannerSettings } from "../../settings";
import type { RemoteTask, Task, WithTime } from "../../task-types";
import type { OnEditAbortedFn, OnUpdateFn, PointerDateTime } from "../../types";
import { getUpdateTrigger } from "../../util/store";

import { useDataviewTasks } from "./use-dataview-tasks";
import { useEditContext } from "./use-edit/use-edit-context";
import { useNewlyStartedTasks } from "./use-newly-started-tasks";
import { useVisibleDailyNotes } from "./use-visible-daily-notes";
import { useVisibleDataviewTasks } from "./use-visible-dataview-tasks";

export function useTasks(props: {
  settingsStore: Writable<DayPlannerSettings>;
  debouncedTaskUpdateTrigger: Readable<object>;
  isOnline: Readable<boolean>;
  visibleDays: Readable<Moment[]>;
  layoutReady: Readable<boolean>;
  dataviewFacade: DataviewFacade;
  metadataCache: MetadataCache;
  currentTime: Readable<Moment>;
  workspaceFacade: WorkspaceFacade;
  onUpdate: OnUpdateFn;
  onEditAborted: OnEditAbortedFn;
  pointerDateTime: Readable<PointerDateTime>;
  dataviewChange: Readable<unknown>;
  remoteTasks: Readable<RemoteTask[]>;
  periodicNotes: PeriodicNotes;
  timeLayer: TimeLayerService;
}) {
  const {
    settingsStore,
    visibleDays,
    layoutReady,
    debouncedTaskUpdateTrigger,
    dataviewFacade,
    periodicNotes,
    metadataCache,
    currentTime,
    workspaceFacade,
    pointerDateTime,
    dataviewChange,
    onUpdate,
    onEditAborted,
    remoteTasks,
    timeLayer,
  } = props;

  const visibleDailyNotes = useVisibleDailyNotes(
    layoutReady,
    debouncedTaskUpdateTrigger,
    visibleDays,
    periodicNotes,
  );

  const dataviewTasks = useDataviewTasks({
    dataviewFacade,
    metadataCache,
    settings: settingsStore,
    visibleDailyNotes,
    refreshSignal: debouncedTaskUpdateTrigger,
  });

  const dataviewTasksForVisibleDays = useVisibleDataviewTasks(
    dataviewTasks,
    visibleDays,
    periodicNotes,
  );

  const plannedTasks = timeLayer.plannedTasks;

  const unscheduledTasks = derived(
    [dataviewTasksForVisibleDays, plannedTasks],
    ([$dataviewTasksForVisibleDays, $plannedTasks]) => {
      const attachedTaskKeys = new Set(
        $plannedTasks
          .map((task) => task.timeLayer?.taskRef)
          .filter((taskRef) => taskRef !== undefined)
          .map((taskRef) => `${taskRef.path}::${taskRef.line}`),
      );

      return $dataviewTasksForVisibleDays.filter((task) => {
        if (!task.isAllDayEvent) {
          return false;
        }

        const location = task.location;

        if (!location) {
          return true;
        }

        const taskKey = `${location.path}::${location.position.start.line}`;

        return !attachedTaskKeys.has(taskKey);
      });
    },
  );

  const tasksWithTimeForToday = derived(
    [plannedTasks, remoteTasks, currentTime],
    ([$plannedTasks, $remoteTasks, $currentTime]: [Task[], Task[], Moment]) => {
      return $plannedTasks
        .concat($remoteTasks)
        .filter(
          (task): task is WithTime<Task> =>
            task.startTime.isSame($currentTime, "day") && !task.isAllDayEvent,
        );
    },
  );

  const abortEditTrigger = derived(
    [plannedTasks, dataviewChange],
    getUpdateTrigger,
  );

  const editContext = useEditContext({
    periodicNotes,
    workspaceFacade,
    onUpdate,
    onEditAborted,
    settings: settingsStore,
    localTasks: plannedTasks,
    displayOnlyTasks: unscheduledTasks,
    remoteTasks,
    pointerDateTime,
    abortEditTrigger,
  });

  const newlyStartedTasks = useNewlyStartedTasks({
    settings: settingsStore,
    tasksWithTimeForToday,
    currentTime,
  });

  return {
    tasksWithTimeForToday,
    editContext,
    newlyStartedTasks,
  };
}
