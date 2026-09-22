export type MetricKey = "liquidResistance" | "tightnessDecay" | "airLiquidRatio";

export type Readings = Record<MetricKey, number>;

export type OrderKind = "initial" | "retest";

/** 检测单：初检为链根（rootId === id），复测通过 rootId 关联原单 */
export interface DetectionOrder {
  id: string;
  kind: OrderKind;
  rootId: string;
  /** 链内序号：1 = 初检，2..n = 第 n-1 次复测 */
  seq: number;
  area: string;
  nozzle: string;
  readings: Readings;
  /** 创建时按规则判定的越限指标 */
  violations: MetricKey[];
  /** 越限时必填：责任人 / 复测期限 */
  owner: string | null;
  deadline: string | null;
  note: string;
  createdAt: string;
}

/** 更正记录：原因 + 旧版快照另存 */
export interface Correction {
  id: string;
  orderId: string;
  rootId: string;
  reason: string;
  previous: DetectionOrder;
  correctedAt: string;
}

export interface PersistedState {
  version: 1;
  orders: DetectionOrder[];
  corrections: Correction[];
}

/** 新增检测 / 复测表单提交内容 */
export interface DetectionDraft {
  area: string;
  nozzle: string;
  readings: Readings;
  owner: string | null;
  deadline: string | null;
  note: string;
}

/** 更正表单提交内容（不含 id/链信息） */
export interface CorrectionPatch {
  area: string;
  nozzle: string;
  readings: Readings;
  owner: string | null;
  deadline: string | null;
  note: string;
}
