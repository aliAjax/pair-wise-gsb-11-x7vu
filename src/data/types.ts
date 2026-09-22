export type MetricKey = "liquidResistance" | "tightnessDecay" | "vaporLiquidRatio";

export type MetricValues = Record<MetricKey, number>;

/** 单项指标的判定结果（保存时固化，便于回查与统计一致） */
export interface MetricVerdict {
  key: MetricKey;
  label: string;
  unit: string;
  value: number;
  pass: boolean;
  limitText: string;
  ruleText: string;
}

export type EntryKind = "初检" | "复测";

/** 一条检测记录；同一 chainId 的记录构成复测链 */
export interface DetectionEntry {
  id: string;
  chainId: string;
  parentId: string | null;
  round: number;
  kind: EntryKind;
  area: string;
  gunNo: string;
  inspector: string;
  checkedAt: string;
  metrics: MetricValues;
  pass: boolean;
  verdicts: MetricVerdict[];
  responsible: string;
  deadline: string;
  notes: string;
  createdAt: string;
}

/** 更正留痕：原因 + 旧版数据另存，不覆盖历史 */
export interface Correction {
  id: string;
  entryId: string;
  chainId: string;
  reason: string;
  oldMetrics: MetricValues;
  oldNotes: string;
  oldPass: boolean;
  correctedAt: string;
}

export type ChainStatus = "正常" | "待复测" | "顺延复测" | "已关闭";

/** 复测链：同一原单（初检）及其全部复测 */
export interface Chain {
  root: DetectionEntry;
  entries: DetectionEntry[];
  latest: DetectionEntry;
  status: ChainStatus;
}

export interface PersistedState {
  entries: DetectionEntry[];
  corrections: Correction[];
}
