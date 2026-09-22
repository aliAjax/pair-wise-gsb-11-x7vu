import { FormEvent, useState } from "react";
import { AREAS, nozzlesOf } from "../data/config";
import { METRIC_RULES } from "../rules/metrics";
import type { CorrectionPatch, DetectionOrder, MetricKey, Readings } from "../types";

type ReadingInputs = Record<MetricKey, string>;

function parseReadings(inputs: ReadingInputs): Readings {
  return {
    liquidResistance: Number(inputs.liquidResistance),
    tightnessDecay: Number(inputs.tightnessDecay),
    airLiquidRatio: Number(inputs.airLiquidRatio),
  };
}

interface CorrectionFormProps {
  order: DetectionOrder;
  onSubmit: (patch: CorrectionPatch, reason: string) => void;
  onCancel: () => void;
}

/** 更正：原因必填，旧版快照由页面层另存；复测单锁定区域/枪号以保持链一致 */
export function CorrectionForm({ order, onSubmit, onCancel }: CorrectionFormProps) {
  const isInitial = order.kind === "initial";
  const [area, setArea] = useState(order.area);
  const [nozzle, setNozzle] = useState(order.nozzle);
  const [readings, setReadings] = useState<ReadingInputs>({
    liquidResistance: String(order.readings.liquidResistance),
    tightnessDecay: String(order.readings.tightnessDecay),
    airLiquidRatio: String(order.readings.airLiquidRatio),
  });
  const [owner, setOwner] = useState(order.owner ?? "");
  const [deadline, setDeadline] = useState(order.deadline ?? "");
  const [note, setNote] = useState(order.note);
  const [reason, setReason] = useState("");

  const nozzles = nozzlesOf(area);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(
      {
        area,
        nozzle,
        readings: parseReadings(readings),
        owner: owner.trim() || null,
        deadline: deadline || null,
        note: note.trim(),
      },
      reason.trim()
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>更正检测单（{isInitial ? "初检" : `第 ${order.seq - 1} 次复测`}）</h3>
      <p className="hint info">更正后按新数值重新判定链状态；更正原因与旧版将另存至更正记录。</p>
      <div className="form-grid">
        <div className="inline-fields">
          <label>
            区域
            {isInitial ? (
              <select
                value={area}
                onChange={(event) => {
                  setArea(event.target.value);
                  setNozzle("");
                }}
                required
              >
                <option value="">请选择区域</option>
                {AREAS.map((item) => (
                  <option key={item.name}>{item.name}</option>
                ))}
              </select>
            ) : (
              <input value={area} disabled />
            )}
          </label>
          <label>
            枪号
            {isInitial ? (
              <select value={nozzle} onChange={(event) => setNozzle(event.target.value)} required disabled={!area}>
                <option value="">{area ? "请选择枪号" : "先选区域"}</option>
                {nozzles.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            ) : (
              <input value={nozzle} disabled />
            )}
          </label>
        </div>

        {METRIC_RULES.map((rule) => (
          <label key={rule.key}>
            {rule.label}（限值 {rule.limitText}）
            <input
              type="number"
              step="any"
              value={readings[rule.key]}
              onChange={(event) => setReadings({ ...readings, [rule.key]: event.target.value })}
              required
            />
          </label>
        ))}

        <div className="inline-fields">
          <label>
            责任人
            <input value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="越限单必填" />
          </label>
          <label>
            复测期限
            <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
          </label>
        </div>

        <label>
          备注
          <textarea value={note} onChange={(event) => setNote(event.target.value)} />
        </label>

        <label>
          更正原因（必填，随旧版另存）
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="说明更正依据，如检测报告编号、录入差错等"
            required
          />
        </label>

        <div className="actions">
          <button type="submit">保存更正</button>
          <button type="button" className="secondary" onClick={onCancel}>
            取消
          </button>
        </div>
      </div>
    </form>
  );
}
