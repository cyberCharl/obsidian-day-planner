import { Menu } from "obsidian";
import { isNotVoid } from "typed-assert";

import type { TimeLayerService } from "../service/time-layer-service";
import type { LocalTask } from "../task-types";

import type { WorkspaceFacade } from "src/service/workspace-facade";

export function createTimeBlockMenu(props: {
  event: MouseEvent | PointerEvent | TouchEvent;
  task: LocalTask;
  workspaceFacade: WorkspaceFacade;
  timeLayer: TimeLayerService;
}) {
  const { event, task, workspaceFacade, timeLayer } = props;
  const { location } = task;

  // todo: remove when types are fixed
  isNotVoid(location);

  const {
    path,
    position: {
      start: { line },
    },
  } = location;

  const menu = new Menu();

  if (task.timeLayer?.kind === "planned") {
    menu.addItem((item) => {
      item
        .setTitle("Start actual now")
        .setIcon("play")
        .onClick(async () => {
          await timeLayer.startActualForTask(task);
        });
    });
  }

  if (task.timeLayer?.kind === "actual" && task.timeLayer.isOpen) {
    menu.addItem((item) => {
      item
        .setTitle("Stop actual now")
        .setIcon("square")
        .onClick(async () => {
          await timeLayer.stopActualTask(task);
        });
    });
  }

  if (task.timeLayer?.taskRef) {
    menu.addItem((item) => {
      item
        .setTitle("Reveal attached task")
        .setIcon("link")
        .onClick(async () => {
          await workspaceFacade.revealLineInFile(
            task.timeLayer!.taskRef!.path,
            task.timeLayer!.taskRef!.line,
          );
        });
    });
  }

  menu.addItem((item) => {
    item
      .setTitle("Reveal block in file")
      .setIcon("file-input")
      .onClick(async () => {
        await workspaceFacade.revealLineInFile(path, line);
      });
  });

  // Obsidian works fine with touch events, but its TypeScript definitions don't reflect that.
  // @ts-expect-error
  menu.showAtMouseEvent(event);
}
