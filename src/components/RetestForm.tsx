import { FormEvent, useMemo, useState } from "react";
import { Chain, effectiveDeadline, effectiveOwner } from "../rules/chain";
import { METRIC_RULES, findViolations, formatValue, ruleOf } from "../rules/metrics";
import type { DetectionDraft, MetricKey, Readings } from "../types";

type ReadingInputs = Record<MetricKey, string>;

function parseReadings(inputs: ReadingInputs): Readings {
  return {
    liquidResistance: Number(inputs.liquidResistance),
    tightnessDecay: Number(inputs.tightnessDecay),
    airLiquidRatio: Number(inputs.airLiquidRatio),
  };
}

interface RetestFormProps {
  chain: Chain;
  onSubmit: (draft: DetectionDraft) => void;
  onCancel: () => void;
}

/**
 * 关联原单的复测：区域/枪号锁定自原单。
 * 仍越限 → 保留新旧值，须填责任人与顺延期限（晚于当前期限）；
 * 全部合限 → 提交后关闭原单。
 */
export function RetestForm({ chain, onSubmit, onCancel }: RetestFormProps) {
  const [readings, setReadings] = useState<ReadingInputs>({
    liquidResistance: String(chain.latest.readings.liquidResistance),
    tightnessDecay: String(chain.latest.readings.tightnessDecay),
    airLiquidRatio: String(chain.latest.readings.airLiquidRatio),
  });
  const [owner, setOwner] = useState(effectiveOwner(chain) === "未指派" ? "" : effectiveOwner(chain));
  const [deadline, setDeadline] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const currentDeadline = effectiveDeadline(chain);
  const hasDeadline = currentDeadline !== "未设期限";
  const filled = METRIC_RULES.every((rule) => readings[rule.key].trim() !== "" && Number.isFinite(Number(readings[rule.key])));
  const violations = useMemo(() => (filled ? findViolations(parseReadings(readings)) : []), [filled, readings]);
  const stillOverLimit = violations.length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!filled) return;
    if (stillOverLimit) {
      if (!owner.trim()) {
        setError("复测仍越限，请填写责任人。");
        return;
      }
      if (!deadline) {
        setError("复测仍越限，请填写顺延后的复测期限。");
        return;
      }
      if (hasDeadline && deadline <= currentDeadline) {
        setError(`顺延期限须晚于当前期限 ${currentDeadline}。`);
        return;
      }
    }
    onSubmit({
      area: chain.root.area,
      nozzle: chain.root.nozzle,
      readings: parseReadings(readings),
      owner: stillOverLimit ? owner.trim() : null,
      deadline: stillOverLimit ? deadline : null,
      note: note.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>新增复测（关联原单）</h3>
      <p className="hint info">
        原单：{chain.root.area} / {chain.root.nozzle}（{chain.root.id.slice(0, 8)}）· 第 {chain.orders.length} 次检测 ·
        当前期限：{currentDeadline}
      </p>
      <div className="form-grid">
        {METRIC_RULES.map((rule) => {
          const oldValue = chain.latest.readings[rule.key];
          return (
            <label key={rule.key}>
              {rule.label}（限值 {rule.limitText}，上次 {formatValue(rule.key, oldValue)}）
              <input
                type="number"
                step="any"
                value={readings[rule.key]}
                onChange={(event) => setReadings({ ...readings, [rule.key]: event.target.value })}
                required
              />
            </label>
          );
        })}

        {filled &&
          (stillOverLimit ? (
            <p className="hint warn">
              仍越限：{violations.map((key) => ruleOf(key).label).join("、")}，新旧值将一并保留，期限顺延。
            </p>
          ) : (
            <p className="hint ok">全部合限，提交后关闭原单。</p>
          ))}

        {stillOverLimit && (
          <div className="inline-fields">
            <label>
              责任人
              <input value={owner} onChange={(event) => setOwner(event.target.value)} required />
            </label>
            <label>
              顺延后期限
              <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} required />
            </label>
          </div>
        )}

        <label>
          备注
          <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="填写复测情况或处置说明" />
        </label>

        {error && <p className="field-error">{error}</p>}

        <div className="actions">
          <button type="submit">提交复测</button>
          <button type="button" className="secondary" onClick={onCancel}>
            取消
          </button>
        </div>
      </div>
    </form>
  );
}
