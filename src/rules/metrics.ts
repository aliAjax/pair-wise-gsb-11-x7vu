import type { MetricKey, Readings } from "../types";

export interface MetricRule {
  key: MetricKey;
  label: string;
  unit: string;
  min: number | null;
  max: number | null;
  /** 限值展示文本，如 “≤ 40 Pa” */
  limitText: string;
  /** 规则说明，受阻项列表中展示 */
  ruleText: string;
  decimals: number;
}

/** 三项油气回收指标限值（参照 GB 20952 加油站大气污染物排放要求） */
export const METRIC_RULES: MetricRule[] = [
  {
    key: "liquidResistance",
    label: "液阻",
    unit: "Pa",
    min: null,
    max: 40,
    limitText: "≤ 40 Pa",
    ruleText: "油气回收管线液阻不超过 40 Pa",
    decimals: 0,
  },
  {
    key: "tightnessDecay",
    label: "密闭性衰减",
    unit: "Pa",
    min: null,
    max: 30,
    limitText: "≤ 30 Pa",
    ruleText: "密闭性 5 分钟压力衰减不超过 30 Pa",
    decimals: 0,
  },
  {
    key: "airLiquidRatio",
    label: "气液比",
    unit: "",
    min: 1.0,
    max: 1.2,
    limitText: "1.00 ~ 1.20",
    ruleText: "气液比须处于 1.00 ~ 1.20 区间",
    decimals: 2,
  },
];

export function ruleOf(key: MetricKey): MetricRule {
  const rule = METRIC_RULES.find((item) => item.key === key);
  if (!rule) throw new Error(`未知指标: ${key}`);
  return rule;
}

export function isWithinLimit(rule: MetricRule, value: number): boolean {
  if (!Number.isFinite(value)) return false;
  if (rule.min !== null && value < rule.min) return false;
  if (rule.max !== null && value > rule.max) return false;
  return true;
}

/** 返回全部越限指标；空数组表示全部合限 */
export function findViolations(readings: Readings): MetricKey[] {
  return METRIC_RULES.filter((rule) => !isWithinLimit(rule, readings[rule.key])).map((rule) => rule.key);
}

export function formatValue(key: MetricKey, value: number): string {
  const rule = ruleOf(key);
  const text = value.toFixed(rule.decimals);
  return rule.unit ? `${text} ${rule.unit}` : text;
}
