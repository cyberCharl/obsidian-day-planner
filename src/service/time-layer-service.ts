import type { Moment } from "moment";
import { normalizePath, Plugin, type Vault } from "obsidian";
import { derived, type Readable, writable } from "svelte/store";

import { defaultDayFormat } from "../constants";
import type { LocalTask, TaskLocation } from "../task-types";
import type {
  DayTimeLayerFile,
  PlannedBlockStatus,
  TimeLayerBlock,
  TimeLayerBlockKind,
  TimeLayerMetadata,
  TimeLayerTaskRef,
} from "../time-layer/types";
import type { OnUpdateFn } from "../types";
import { EditMode } from "../ui/hooks/use-edit/types";
import { getId } from "../util/id";
import { strictParse } from "../util/moment";
import { getDayKey, getOneLineSummary } from "../util/task-utils";

import type { PeriodicNotes } from "./periodic-notes";

const frontmatterSeparator = "---";
const lineFieldRegExp = /\[([^\]]+)::([^\]]*)\]/g;
const timeLayerFolder = "Day Planner/Time";
const timeLayerType = "day-planner-time";
const plannedHeading = "## Planned";
const actualHeading = "## Actual";
const actualDailyNoteHeading = "## Actual Time";

function normalizeTitle(title: string) {
  const collapsed = title.replace(/\s+/g, " ").trim();

  return collapsed.length > 0 ? collapsed : "Untitled block";
}

function sortBlocks(blocks: TimeLayerBlock[]) {
  return blocks.toSorted((a, b) => {
    const byStart = Date.parse(a.start) - Date.parse(b.start);

    if (byStart !== 0) {
      return byStart;
    }

    return a.id.localeCompare(b.id);
  });
}

function createInlineField(key: string, value: string | number | undefined) {
  if (value === undefined || value === "") {
    return undefined;
  }

  return `[${key}::${value}]`;
}

function getFields(line: string) {
  return [...line.matchAll(lineFieldRegExp)].reduce<Record<string, string>>(
    (result, [, key, value]) => {
      result[key.trim()] = value.trim();

      return result;
    },
    {},
  );
}

function stripInlineFields(line: string) {
  return line
    .replace(lineFieldRegExp, "")
    .replace(/^\s*-\s*/, "")
    .trim();
}

function getLinePosition(path: string, line: number): TaskLocation {
  return {
    path,
    position: {
      start: { line, col: 0, offset: 0 },
      end: { line, col: 0, offset: 0 },
    },
  };
}

function toStatus(value?: string): PlannedBlockStatus | undefined {
  if (value === "firm" || value === "tentative") {
    return value;
  }

  return undefined;
}

function createEmptyDay(dayKey: string, path: string): DayTimeLayerFile {
  return {
    dayKey,
    path,
    planned: [],
    actual: [],
  };
}

function renderBlock(block: TimeLayerBlock) {
  const fields = [
    createInlineField("id", block.id),
    createInlineField("start", block.start),
    createInlineField("end", block.end),
    createInlineField("status", block.status),
    createInlineField("task-path", block.taskRef?.path),
    createInlineField("task-line", block.taskRef?.line),
    createInlineField("planned", block.plannedBlockId),
  ].filter((value): value is string => value !== undefined);

  return `- ${normalizeTitle(block.title)} ${fields.join(" ")}`.trimEnd();
}

export function getTimeLayerPath(day: Moment | string) {
  const dayKey = typeof day === "string" ? day : day.format(defaultDayFormat);

  return normalizePath(`${timeLayerFolder}/${dayKey}.md`);
}

export function parseTimeLayerPath(path: string) {
  if (!path.startsWith(`${timeLayerFolder}/`) || !path.endsWith(".md")) {
    return undefined;
  }

  const basename = path.slice(timeLayerFolder.length + 1, -3);

  return /^\d{4}-\d{2}-\d{2}$/.test(basename) ? basename : undefined;
}

export function parseTimeLayerFile(props: {
  path: string;
  dayKey: string;
  text: string;
}) {
  const { path, dayKey, text } = props;
  const result = createEmptyDay(dayKey, path);
  const lines = text.split("\n");
  let section: TimeLayerBlockKind | undefined;
  let inFrontmatter = false;

  lines.forEach((line, lineNumber) => {
    const trimmed = line.trim();

    if (lineNumber === 0 && trimmed === frontmatterSeparator) {
      inFrontmatter = true;
      return;
    }

    if (inFrontmatter) {
      if (trimmed === frontmatterSeparator) {
        inFrontmatter = false;
      }

      return;
    }

    if (trimmed === plannedHeading) {
      section = "planned";
      return;
    }

    if (trimmed === actualHeading) {
      section = "actual";
      return;
    }

    if (!section || !trimmed.startsWith("- ")) {
      return;
    }

    const fields = getFields(line);
    const start = fields.start;

    if (!start || !strictParse(start).isValid()) {
      return;
    }

    const end = fields.end;

    if (end && !strictParse(end).isValid()) {
      return;
    }

    const block: TimeLayerBlock = {
      id: fields.id || getId(),
      kind: section,
      title: normalizeTitle(stripInlineFields(line)),
      start,
      end,
      path,
      dayKey,
      line: lineNumber,
      status: toStatus(fields.status),
      taskRef:
        fields["task-path"] && fields["task-line"]
          ? {
              path: fields["task-path"],
              line: Number(fields["task-line"]),
            }
          : undefined,
      plannedBlockId: fields.planned,
    };

    result[section].push(block);
  });

  return {
    ...result,
    planned: sortBlocks(result.planned),
    actual: sortBlocks(result.actual),
  };
}

export function renderTimeLayerFile(day: DayTimeLayerFile) {
  const planned = sortBlocks(day.planned);
  const actual = sortBlocks(day.actual);

  return [
    frontmatterSeparator,
    `type: ${timeLayerType}`,
    `day: ${day.dayKey}`,
    "version: 1",
    `description: "Planner-managed planned and actual time blocks for ${day.dayKey}."`,
    frontmatterSeparator,
    "",
    `# ${day.dayKey} Time`,
    "",
    plannedHeading,
    ...(planned.length > 0 ? planned.map(renderBlock) : [""]),
    "",
    actualHeading,
    ...(actual.length > 0 ? actual.map(renderBlock) : [""]),
    "",
  ].join("\n");
}

function toTimeLayerMetadata(block: TimeLayerBlock): TimeLayerMetadata {
  return {
    source: "time-layer",
    blockId: block.id,
    kind: block.kind,
    dayKey: block.dayKey,
    status: block.status,
    taskRef: block.taskRef,
    plannedBlockId: block.plannedBlockId,
    isOpen: block.end === undefined,
  };
}

function toLocalTask(block: TimeLayerBlock, currentTime: Moment): LocalTask {
  const startTime = strictParse(block.start);
  const endTime = block.end ? strictParse(block.end) : currentTime;
  const rawDuration = endTime.diff(startTime, "minutes");
  const durationMinutes = rawDuration > 0 ? rawDuration : 1;

  return {
    id: block.id,
    text: normalizeTitle(block.title),
    startTime,
    durationMinutes,
    symbol: "-",
    location: getLinePosition(block.path, block.line),
    timeLayer: toTimeLayerMetadata(block),
  };
}

export class TimeLayerService {
  readonly days = writable<Record<string, DayTimeLayerFile>>({});
  readonly plannedTasks: Readable<LocalTask[]>;
  readonly actualTasks: Readable<LocalTask[]>;
  readonly activeActualTasks: Readable<LocalTask[]>;
  readonly recentActualTasks: Readable<LocalTask[]>;
  private visibleDayKeys = new Set<string>();

  constructor(
    private readonly plugin: Plugin,
    private readonly vault: Vault,
    private readonly periodicNotes: PeriodicNotes,
    private readonly currentTime: Readable<Moment>,
  ) {
    this.plannedTasks = derived([this.days, currentTime], ([$days, $now]) =>
      Object.values($days)
        .flatMap((day) => day.planned.map((block) => toLocalTask(block, $now)))
        .toSorted((a, b) => a.startTime.diff(b.startTime)),
    );

    this.actualTasks = derived([this.days, currentTime], ([$days, $now]) =>
      Object.values($days)
        .flatMap((day) => day.actual.map((block) => toLocalTask(block, $now)))
        .toSorted((a, b) => a.startTime.diff(b.startTime)),
    );

    this.activeActualTasks = derived(this.actualTasks, ($actualTasks) =>
      $actualTasks.filter((task) => task.timeLayer?.isOpen),
    );

    this.recentActualTasks = derived(this.actualTasks, ($actualTasks) =>
      $actualTasks
        .filter((task) => !task.timeLayer?.isOpen)
        .toSorted((a, b) => b.startTime.diff(a.startTime))
        .slice(0, 20),
    );

    plugin.registerEvent(
      vault.on("modify", (file) => {
        void this.handlePathChange(file.path);
      }),
    );

    plugin.registerEvent(
      vault.on("delete", (file) => {
        void this.handlePathChange(file.path, { deleted: true });
      }),
    );

    plugin.registerEvent(
      vault.on("rename", (file, oldPath) => {
        void Promise.all([
          this.handlePathChange(oldPath, { deleted: true }),
          this.handlePathChange(file.path),
        ]);
      }),
    );
  }

  watchVisibleDays = (visibleDays: Readable<Moment[]>) => {
    return visibleDays.subscribe((days) => {
      const nextVisibleDayKeys = new Set(days.map(getDayKey));

      this.visibleDayKeys = nextVisibleDayKeys;
      this.days.update((current) =>
        Object.fromEntries(
          Object.entries(current).filter(([dayKey]) =>
            nextVisibleDayKeys.has(dayKey),
          ),
        ),
      );
      void this.refreshDays(days);
    });
  };

  getActualTasksForDay(day: Moment) {
    const dayKey = getDayKey(day);

    return derived(this.actualTasks, ($actualTasks) =>
      $actualTasks.filter((task) => getDayKey(task.startTime) === dayKey),
    );
  }

  async applyPlannedTaskUpdate(base: LocalTask[], next: LocalTask[]) {
    const affectedDayKeys = new Set<string>();
    const byDay = new Map<string, DayTimeLayerFile>();

    base.forEach((task) => {
      const dayKey = task.timeLayer?.dayKey || getDayKey(task.startTime);

      affectedDayKeys.add(dayKey);
    });

    next.forEach((task) => {
      affectedDayKeys.add(getDayKey(task.startTime));
    });

    await Promise.all(
      [...affectedDayKeys].map(async (dayKey) => {
        const dayData = await this.readDay(dayKey);

        byDay.set(dayKey, dayData);
      }),
    );

    base.forEach((task) => {
      const dayKey = task.timeLayer?.dayKey || getDayKey(task.startTime);
      const day = byDay.get(dayKey);

      if (!day) {
        return;
      }

      day.planned = day.planned.filter((block) => block.id !== task.id);
    });

    next.forEach((task) => {
      const dayKey = getDayKey(task.startTime);
      const day = byDay.get(dayKey);

      if (!day) {
        return;
      }

      day.planned.push(this.createPlannedBlock(task, day));
    });

    await Promise.all(
      [...byDay.values()].map(async (day) => {
        day.planned = sortBlocks(day.planned);
        await this.writeDay(day);
        await this.refreshDay(day.dayKey);
      }),
    );
  }

  async startActualForTask(task: LocalTask, startTime = window.moment()) {
    const day = await this.readDay(getDayKey(startTime));

    day.actual.push(this.createActualBlock(task, day, startTime));
    day.actual = sortBlocks(day.actual);

    await this.writeDay(day);
    await this.refreshDay(day.dayKey);
  }

  async stopActualTask(task: LocalTask, endTime = window.moment()) {
    const dayKey = task.timeLayer?.dayKey || getDayKey(task.startTime);
    const blockId = task.timeLayer?.blockId;

    if (!blockId) {
      return;
    }

    const day = await this.readDay(dayKey);
    const block = day.actual.find((candidate) => candidate.id === blockId);

    if (!block) {
      return;
    }

    block.end = endTime.toISOString(true);
    day.actual = sortBlocks(day.actual);

    await this.writeDay(day);
    await this.refreshDay(day.dayKey);
  }

  async ensureActualEmbedInDailyNote(day: Moment) {
    const dailyNote = await this.periodicNotes.createDailyNoteIfNeeded(day);
    const timeLayerFile = await this.ensureDayFile(day);
    const embed = `![[${timeLayerFile.path}#Actual]]`;

    const contents = await this.vault.cachedRead(dailyNote);

    if (contents.includes(embed)) {
      return;
    }

    const updated = `${contents.trimEnd()}\n\n${actualDailyNoteHeading}\n${embed}\n`;

    await this.vault.modify(dailyNote, updated);
  }

  async ensureDayFile(day: Moment | string) {
    const dayKey = typeof day === "string" ? day : getDayKey(day);
    const path = getTimeLayerPath(dayKey);
    const existing = this.vault.getFileByPath(path);

    if (existing) {
      return existing;
    }

    await this.ensureFolderForPath(path);

    return this.vault.create(
      path,
      renderTimeLayerFile(createEmptyDay(dayKey, path)),
    );
  }

  async readDay(day: Moment | string) {
    const dayKey = typeof day === "string" ? day : getDayKey(day);
    const path = getTimeLayerPath(dayKey);
    const file = this.vault.getFileByPath(path);

    if (!file) {
      return createEmptyDay(dayKey, path);
    }

    const text = await this.vault.cachedRead(file);

    return parseTimeLayerFile({ path, dayKey, text });
  }

  async refreshDays(days: Moment[]) {
    await Promise.all(days.map((day) => this.refreshDay(day)));
  }

  async refreshDay(day: Moment | string) {
    const next = await this.readDay(day);

    this.setDay(next);
  }

  private async handlePathChange(
    path: string,
    options?: { deleted?: boolean },
  ) {
    const dayKey = parseTimeLayerPath(path);

    if (!dayKey || !this.visibleDayKeys.has(dayKey)) {
      return;
    }

    if (options?.deleted) {
      this.days.update((current) => {
        const next = { ...current };

        delete next[dayKey];

        return next;
      });

      return;
    }

    await this.refreshDay(dayKey);
  }

  private createActualBlock(
    task: LocalTask,
    day: DayTimeLayerFile,
    startTime: Moment,
  ): TimeLayerBlock {
    const taskRef = this.getTaskRef(task);

    return {
      id: getId(),
      kind: "actual",
      title: normalizeTitle(getOneLineSummary(task)),
      start: startTime.toISOString(true),
      path: day.path,
      dayKey: day.dayKey,
      line: 0,
      taskRef,
      plannedBlockId:
        task.timeLayer?.kind === "planned" ? task.timeLayer.blockId : undefined,
    };
  }

  private createPlannedBlock(
    task: LocalTask,
    day: DayTimeLayerFile,
  ): TimeLayerBlock {
    const end = task.startTime.clone().add(task.durationMinutes, "minutes");

    return {
      id: task.timeLayer?.blockId || task.id,
      kind: "planned",
      title: normalizeTitle(getOneLineSummary(task)),
      start: task.startTime.toISOString(true),
      end: end.toISOString(true),
      path: day.path,
      dayKey: day.dayKey,
      line: 0,
      status: task.timeLayer?.status || "firm",
      taskRef: this.getTaskRef(task),
    };
  }

  private getTaskRef(task: LocalTask): TimeLayerTaskRef | undefined {
    if (task.timeLayer?.taskRef) {
      return task.timeLayer.taskRef;
    }

    const location = task.location;

    if (!location || parseTimeLayerPath(location.path)) {
      return undefined;
    }

    return {
      path: location.path,
      line: location.position.start.line,
    };
  }

  private async ensureFolderForPath(path: string) {
    const parts = path.split("/");

    for (let index = 1; index < parts.length; index++) {
      const folder = normalizePath(parts.slice(0, index).join("/"));

      if (!folder || this.vault.getAbstractFileByPath(folder)) {
        continue;
      }

      await this.vault.createFolder(folder);
    }
  }

  private async writeDay(day: DayTimeLayerFile) {
    const normalizedDay = {
      ...day,
      planned: sortBlocks(day.planned),
      actual: sortBlocks(day.actual),
    };
    const contents = renderTimeLayerFile(normalizedDay);
    const file = await this.ensureDayFile(day.dayKey);

    await this.vault.modify(file, contents);
  }

  private setDay(day: DayTimeLayerFile) {
    const withNormalizedPath = {
      ...day,
      path: getTimeLayerPath(day.dayKey),
    };

    this.days.update((current) => ({
      ...current,
      [day.dayKey]: withNormalizedPath,
    }));
  }
}

export function createTimeLayerUpdateHandler(props: {
  timeLayer: TimeLayerService;
  onEditCanceled: () => void;
  onEditConfirmed: () => void;
  getTextInput: () => Promise<string | undefined>;
}): OnUpdateFn {
  const { timeLayer, onEditCanceled, onEditConfirmed, getTextInput } = props;

  return async (base, next, mode) => {
    let nextTasks = next;

    if (mode === EditMode.CREATE) {
      const baseIds = new Set(base.map((task) => task.id));
      const created = next.find((task) => !baseIds.has(task.id));

      if (created) {
        const text = await getTextInput();

        if (!text) {
          onEditCanceled();
          return;
        }

        nextTasks = next.map((task) =>
          task.id === created.id
            ? {
                ...task,
                text,
              }
            : task,
        );
      }
    }

    await timeLayer.applyPlannedTaskUpdate(base, nextTasks);
    onEditConfirmed();
  };
}
