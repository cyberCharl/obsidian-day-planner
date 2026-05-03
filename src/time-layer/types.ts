export type TimeLayerBlockKind = "planned" | "actual";
export type PlannedBlockStatus = "firm" | "tentative";

export interface TimeLayerTaskRef {
  path: string;
  line: number;
}

export interface TimeLayerMetadata {
  source: "time-layer";
  blockId: string;
  kind: TimeLayerBlockKind;
  dayKey: string;
  status?: PlannedBlockStatus;
  taskRef?: TimeLayerTaskRef;
  plannedBlockId?: string;
  isOpen?: boolean;
}

export interface TimeLayerBlock {
  id: string;
  kind: TimeLayerBlockKind;
  title: string;
  start: string;
  end?: string;
  path: string;
  dayKey: string;
  line: number;
  status?: PlannedBlockStatus;
  taskRef?: TimeLayerTaskRef;
  plannedBlockId?: string;
}

export interface DayTimeLayerFile {
  dayKey: string;
  path: string;
  planned: TimeLayerBlock[];
  actual: TimeLayerBlock[];
}
