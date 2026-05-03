import { describe, expect, test } from "vitest";

import {
  getTimeLayerPath,
  parseTimeLayerFile,
  parseTimeLayerPath,
  renderTimeLayerFile,
} from "../../src/service/time-layer-service";

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
});
