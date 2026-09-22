import type { DetectionOrder, PersistedState } from "../types";
import { findViolations } from "../rules/metrics";

function makeOrder(partial: Omit<DetectionOrder, "violations">): DetectionOrder {
  return { ...partial, violations: findViolations(partial.readings) };
}

/** 首次打开时的示例数据：一条正常单、一条待复测、一条复测仍越限的顺延链 */
export function seedState(): PersistedState {
  const now = Date.now();
  const isoDaysAgo = (days: number) => new Date(now - days * 86400000).toISOString();
  const dateInDays = (days: number) => new Date(now + days * 86400000).toISOString().slice(0, 10);

  const orders: DetectionOrder[] = [
    makeOrder({
      id: "seed-1",
      kind: "initial",
      rootId: "seed-1",
      seq: 1,
      area: "前场加油区",
      nozzle: "1号枪",
      readings: { liquidResistance: 28, tightnessDecay: 12, airLiquidRatio: 1.08 },
      owner: null,
      deadline: null,
      note: "例行月检，三项指标全部合限。",
      createdAt: isoDaysAgo(6),
    }),
    makeOrder({
      id: "seed-2",
      kind: "initial",
      rootId: "seed-2",
      seq: 1,
      area: "前场加油区",
      nozzle: "3号枪",
      readings: { liquidResistance: 33, tightnessDecay: 18, airLiquidRatio: 1.32 },
      owner: "何鑫",
      deadline: dateInDays(5),
      note: "气液比偏高，待复测确认。",
      createdAt: isoDaysAgo(3),
    }),
    makeOrder({
      id: "seed-3",
      kind: "initial",
      rootId: "seed-3",
      seq: 1,
      area: "后场加油区",
      nozzle: "8号枪",
      readings: { liquidResistance: 52, tightnessDecay: 22, airLiquidRatio: 1.12 },
      owner: "何鑫",
      deadline: dateInDays(2),
      note: "液阻超限，排查回收管路。",
      createdAt: isoDaysAgo(4),
    }),
    makeOrder({
      id: "seed-3-r1",
      kind: "retest",
      rootId: "seed-3",
      seq: 2,
      area: "后场加油区",
      nozzle: "8号枪",
      readings: { liquidResistance: 46, tightnessDecay: 20, airLiquidRatio: 1.1 },
      owner: "何鑫",
      deadline: dateInDays(7),
      note: "更换回气胶管后复测，液阻仍超限，期限顺延。",
      createdAt: isoDaysAgo(1),
    }),
  ];

  return {
    version: 1,
    orders,
    corrections: [
      {
        id: "seed-c1",
        orderId: "seed-3-r1",
        rootId: "seed-3",
        reason: "录入时气液比小数点错位，按检测报告更正。",
        previous: makeOrder({
          id: "seed-3-r1",
          kind: "retest",
          rootId: "seed-3",
          seq: 2,
          area: "后场加油区",
          nozzle: "8号枪",
          readings: { liquidResistance: 46, tightnessDecay: 20, airLiquidRatio: 1.01 },
          owner: "何鑫",
          deadline: dateInDays(7),
          note: "更换回气胶管后复测，液阻仍超限，期限顺延。",
          createdAt: isoDaysAgo(1),
        }),
        correctedAt: isoDaysAgo(0),
      },
    ],
  };
}
