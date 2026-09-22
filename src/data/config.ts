import { evaluateMetrics, isPass } from "../rules/metricRules";
import type { Correction, DetectionEntry, MetricValues, PersistedState } from "./types";

export const project = {
  number: 10,
  folder: "dfwl/frontend/dfwlfront-10",
  industry: "石油",
  title: "油气回收检测复测台",
  subtitle: "登记液阻、密闭性衰减与气液比；任一指标越限即转入待复测，复测闭环全程留痕。",
  stack: ["React", "Vite", "TypeScript", "Zustand", "Ant Design"],
  storageKey: "dfwlfront-10-vapor-recovery",
} as const;

export const TABS = ["检测登记", "复测台", "受阻项"] as const;
export type TabKey = (typeof TABS)[number];

export const AREAS: { name: string; guns: string[] }[] = [
  { name: "前庭加油区", guns: ["1号枪", "2号枪", "3号枪", "4号枪"] },
  { name: "后庭加油区", guns: ["5号枪", "6号枪", "7号枪", "8号枪"] },
  { name: "撬装加油区", guns: ["9号枪", "10号枪"] },
];

interface SeedSpec {
  id: string;
  chainId: string;
  parentId: string | null;
  round: number;
  area: string;
  gunNo: string;
  inspector: string;
  checkedAt: string;
  metrics: MetricValues;
  responsible?: string;
  deadline?: string;
  notes?: string;
  createdAt: string;
}

function makeEntry(spec: SeedSpec): DetectionEntry {
  const verdicts = evaluateMetrics(spec.metrics);
  return {
    id: spec.id,
    chainId: spec.chainId,
    parentId: spec.parentId,
    round: spec.round,
    kind: spec.round === 1 ? "初检" : "复测",
    area: spec.area,
    gunNo: spec.gunNo,
    inspector: spec.inspector,
    checkedAt: spec.checkedAt,
    metrics: spec.metrics,
    verdicts,
    pass: isPass(verdicts),
    responsible: spec.responsible ?? "",
    deadline: spec.deadline ?? "",
    notes: spec.notes ?? "",
    createdAt: spec.createdAt,
  };
}

const seedEntries: DetectionEntry[] = [
  makeEntry({
    id: "seed-a1", chainId: "seed-a1", parentId: null, round: 1,
    area: "前庭加油区", gunNo: "1号枪", inspector: "何鑫", checkedAt: "2026-09-20",
    metrics: { liquidResistance: 120, tightnessDecay: 30, vaporLiquidRatio: 1.08 },
    notes: "例行月检，三项全部合限",
    createdAt: "2026-09-20T09:00:00.000Z",
  }),
  makeEntry({
    id: "seed-b1", chainId: "seed-b1", parentId: null, round: 1,
    area: "前庭加油区", gunNo: "3号枪", inspector: "何鑫", checkedAt: "2026-09-21",
    metrics: { liquidResistance: 132, tightnessDecay: 46, vaporLiquidRatio: 1.34 },
    responsible: "王强", deadline: "2026-09-28",
    notes: "气液比偏高，检查回收泵后安排复测",
    createdAt: "2026-09-21T10:00:00.000Z",
  }),
  makeEntry({
    id: "seed-c1", chainId: "seed-c1", parentId: null, round: 1,
    area: "后庭加油区", gunNo: "6号枪", inspector: "周洁", checkedAt: "2026-09-15",
    metrics: { liquidResistance: 188, tightnessDecay: 40, vaporLiquidRatio: 1.12 },
    responsible: "李敏", deadline: "2026-09-20",
    notes: "液阻越限，排查回气管路",
    createdAt: "2026-09-15T09:30:00.000Z",
  }),
  makeEntry({
    id: "seed-c2", chainId: "seed-c1", parentId: "seed-c1", round: 2,
    area: "后庭加油区", gunNo: "6号枪", inspector: "周洁", checkedAt: "2026-09-21",
    metrics: { liquidResistance: 164, tightnessDecay: 38, vaporLiquidRatio: 1.1 },
    responsible: "李敏", deadline: "2026-09-30",
    notes: "清管后复测仍越限，期限顺延至 9 月底",
    createdAt: "2026-09-21T15:00:00.000Z",
  }),
  makeEntry({
    id: "seed-d1", chainId: "seed-d1", parentId: null, round: 1,
    area: "后庭加油区", gunNo: "7号枪", inspector: "何鑫", checkedAt: "2026-09-10",
    metrics: { liquidResistance: 140, tightnessDecay: 62, vaporLiquidRatio: 1.05 },
    responsible: "王强", deadline: "2026-09-16",
    notes: "密闭性衰减越限，更换密封件",
    createdAt: "2026-09-10T08:40:00.000Z",
  }),
  makeEntry({
    id: "seed-d2", chainId: "seed-d1", parentId: "seed-d1", round: 2,
    area: "后庭加油区", gunNo: "7号枪", inspector: "何鑫", checkedAt: "2026-09-15",
    metrics: { liquidResistance: 128, tightnessDecay: 41, vaporLiquidRatio: 1.06 },
    notes: "复测合格，原单关闭",
    createdAt: "2026-09-15T14:20:00.000Z",
  }),
];

const seedCorrections: Correction[] = [
  {
    id: "seed-cor-1",
    entryId: "seed-d2",
    chainId: "seed-d1",
    reason: "气液比抄表误读，现场复核确认为 1.06",
    oldMetrics: { liquidResistance: 128, tightnessDecay: 41, vaporLiquidRatio: 1.26 },
    oldNotes: "复测记录",
    oldPass: false,
    correctedAt: "2026-09-15T15:05:00.000Z",
  },
];

export function seedState(): PersistedState {
  return { entries: seedEntries, corrections: seedCorrections };
}
