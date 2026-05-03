import moment from "moment";
import { writable } from "svelte/store";
import { describe, expect, test } from "vitest";

import {
  getTimeLayerPath,
  parseTimeLayerFile,
  parseTimeLayerPath,
  renderTimeLayerFile,
  TimeLayerService,
} from "../../src/service/time-layer-service";
import type { LocalTask } from "../../src/task-types";
import { createInMemoryFile } from "../test-utils";

class TestVault {
  readonly files = new Map<string, ReturnType<typeof createInMemoryFile>>();
  readonly folders = new Set<string>();

  constructor(files: Array<{ path: string; contents: string }>) {
    files.forEach((file) =>
      this.files.set(file.path, createInMemoryFile(file)),
    );
  }

  on() {
    return () => {};
  }

  getFileByPath(path: string) {
    return this.files.get(path) || null;
  }

  getAbstractFileByPath(path: string) {
    return this.files.get(path) || (this.folders.has(path) ? { path } : null);
  }

  async cachedRead(file: ReturnType<typeof createInMemoryFile>) {
    return file.contents;
  }

  async createFolder(path: string) {
    this.folders.add(path);
  }

  async create(path: string, contents: string) {
    const file = createInMemoryFile({ path, contents });

    this.files.set(path, file);

    return file;
  }

  async modify(file: ReturnType<typeof createInMemoryFile>, contents: string) {
    file.contents = contents;
  }
}

class TestPlugin {
  registerEvent() {
    return () => {};
  }
}

function createService(files: Array<{ path: string; contents: string }>) {
  const vault = new TestVault(files);
  const periodicNotes = {
    async createDailyNoteIfNeeded(day: moment.Moment) {
      const path = `${day.format("YYYY-MM-DD")}.md`;
      const existing = vault.getFileByPath(path);

      if (existing) {
        return existing;
      }

      return vault.create(path, "# Daily Note\n");
    },
  };
  const service = new TimeLayerService(
    new TestPlugin() as never,
    vault as never,
    periodicNotes as never,
    writable(moment("2026-05-03T12:00:00+02:00")),
  );

  return { service, vault };
}

describe("time-layer file format", () => {
  test("renders and parses planned and actual blocks", () => {
    const path = getTimeLayerPath("2026-05-03");
    const rendered = renderTimeLayerFile({
      dayKey: "2026-05-03",
      path,
      planned: [
        {
          id: "planned-1",
          kind: "planned",
          title: "Deep work",
          start: "2026-05-03T09:00:00+02:00",
          end: "2026-05-03T11:00:00+02:00",
          status: "firm",
          path,
          dayKey: "2026-05-03",
          line: 0,
          taskRef: {
            path: "Projects/Alpha.md",
            line: 14,
          },
        },
      ],
      actual: [
        {
          id: "actual-1",
          kind: "actual",
          title: "Deep work",
          start: "2026-05-03T09:10:00+02:00",
          end: "2026-05-03T10:55:00+02:00",
          plannedBlockId: "planned-1",
          path,
          dayKey: "2026-05-03",
          line: 0,
        },
      ],
    });

    const parsed = parseTimeLayerFile({
      path,
      dayKey: "2026-05-03",
      text: rendered,
    });

    expect(parsed).toMatchObject({
      dayKey: "2026-05-03",
      planned: [
        {
          id: "planned-1",
          title: "Deep work",
          status: "firm",
          taskRef: {
            path: "Projects/Alpha.md",
            line: 14,
          },
        },
      ],
      actual: [
        {
          id: "actual-1",
          title: "Deep work",
          plannedBlockId: "planned-1",
        },
      ],
    });
  });

  test("extracts the day key from time-layer paths", () => {
    expect(parseTimeLayerPath("Day Planner/Time/2026-05-03.md")).toBe(
      "2026-05-03",
    );
    expect(parseTimeLayerPath("daily/2026-05-03.md")).toBeUndefined();
  });

  test("writes planned blocks into the canonical day file", async () => {
    const { service, vault } = createService([]);

    const next: LocalTask[] = [
      {
        id: "planned-1",
        text: "Deep work",
        startTime: moment("2026-05-03T09:00:00+02:00"),
        durationMinutes: 120,
        symbol: "-",
      },
    ];

    await service.applyPlannedTaskUpdate([], next);

    const written = vault.getFileByPath("Day Planner/Time/2026-05-03.md");

    expect(written?.contents).toContain("## Planned");
    expect(written?.contents).toContain("Deep work [id::planned-1]");
    expect(written?.contents).toContain("[end::2026-05-03T11:00:00.000+02:00]");
  });

  test("embeds the actual section into the daily note without duplicating data", async () => {
    const { service, vault } = createService([
      {
        path: "2026-05-03.md",
        contents: "# Daily Note\n",
      },
    ]);

    await service.ensureActualEmbedInDailyNote(moment("2026-05-03"));

    const dailyNote = vault.getFileByPath("2026-05-03.md");

    expect(dailyNote?.contents).toContain("## Actual Time");
    expect(dailyNote?.contents).toContain(
      "![[Day Planner/Time/2026-05-03.md#Actual]]",
    );
  });
});
