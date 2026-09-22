import type { MetricKey, MetricValues } from "../data/types";
import { evaluateMetrics, METRIC_RULES } from "../rules/metricRules";

export type MetricDraft = Record<MetricKey, string>;

export const emptyMetricDraft: MetricDraft = {
  liquidResistance: "",
  tightnessDecay: "",
  vaporLiquidRatio: "",
};

export function draftFromMetrics(metrics: MetricValues): MetricDraft {
  return {
    liquidResistance: String(metrics.liquidResistance),
    tightnessDecay: String(metrics.tightnessDecay),
    vaporLiquidRatio: String(metrics.vaporLiquidRatio),
  };
}

/** 三项指标全部填为合法非负数才返回数值，否则视为未填完 */
export function parseMetrics(draft: MetricDraft): MetricValues | null {
  const values = {} as MetricValues;
  for (const rule of METRIC_RULES) {
    const raw = draft[rule.key].trim();
    const num = Number(raw);
    if (raw === "" || Number.isNaN(num) || num < 0) return null;
    values[rule.key] = num;
  }
  return values;
}

export function MetricInputs({
  draft,
  onChange,
}: {
  draft: MetricDraft;
  onChange: (next: MetricDraft) => void;
}) {
  return (
    <div className="metric-inputs">
      {METRIC_RULES.map((rule) => (
        <label key={rule.key}>
          {rule.label}{rule.unit ? `（${rule.unit}）` : ""}
          <span className="limit-hint">限值 {rule.limitText}</span>
          <input
            type="number"
            min="0"
            step={rule.key === "vaporLiquidRatio" ? "0.01" : "1"}
            value={draft[rule.key]}
            onChange={(event) => onChange({ ...draft, [rule.key]: event.target.value })}
            required
          />
        </label>
      ))}
    </div>
  );
}

/** 实时判定预览：任一越限会在提交前明示 */
export function VerdictList({ metrics }: { metrics: MetricValues }) {
  return (
    <ul className="verdicts">
      {evaluateMetrics(metrics).map((verdict) => (
        <li key={verdict.key} className={verdict.pass ? "pass" : "fail"}>
          <span>
            {verdict.label} {verdict.value}{verdict.unit ? ` ${verdict.unit}` : ""}
          </span>
          <span>{verdict.pass ? "合限" : `越限（限值 ${verdict.limitText}）`}</span>
        </li>
      ))}
    </ul>
  );
}
