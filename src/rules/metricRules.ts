import type { MetricKey, MetricValues, MetricVerdict } from "../data/types";

export interface MetricRule {
  key: MetricKey;
  label: string;
  unit: string;
  limitText: string;
  ruleText: string;
  check: (value: number) => boolean;
}

/** 油气回收三项检测限值（依据 GB 20952 加油站大气污染物排放标准设定） */
export const METRIC_RULES: MetricRule[] = [
  {
    key: "liquidResistance",
    label: "液阻",
    unit: "Pa",
    limitText: "≤ 155 Pa",
    ruleText: "GB 20952 液阻：通入 38 L/min 氮气时压力不大于 155 Pa",
    check: (value) => value <= 155,
  },
  {
    key: "tightnessDecay",
    label: "密闭性衰减",
    unit: "Pa",
    limitText: "≤ 50 Pa",
    ruleText: "GB 20952 密闭性：加压后 5 min 压力衰减不大于 50 Pa",
    check: (value) => value <= 50,
  },
  {
    key: "vaporLiquidRatio",
    label: "气液比",
    unit: "",
    limitText: "1.00 ~ 1.20",
    ruleText: "GB 20952 气液比：回收气量与加油量之比须在 1.00 ~ 1.20",
    check: (value) => value >= 1.0 && value <= 1.2,
  },
];

export function evaluateMetrics(metrics: MetricValues): MetricVerdict[] {
  return METRIC_RULES.map((rule) => ({
    key: rule.key,
    label: rule.label,
    unit: rule.unit,
    value: metrics[rule.key],
    pass: rule.check(metrics[rule.key]),
    limitText: rule.limitText,
    ruleText: rule.ruleText,
  }));
}

/** 全部合限才算通过；任一越限即进入待复测 */
export function isPass(verdicts: MetricVerdict[]): boolean {
  return verdicts.every((verdict) => verdict.pass);
}
