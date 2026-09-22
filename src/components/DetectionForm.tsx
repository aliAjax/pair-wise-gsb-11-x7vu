import { FormEvent, useMemo, useState } from "react";
import { AREAS, nozzlesOf, project } from "../data/config";
import { METRIC_RULES, findViolations, ruleOf } from "../rules/metrics";
import type { DetectionDraft, MetricKey, Readings } from "../types";

type ReadingInputs = Record<MetricKey, string>;

function blankReadings(): ReadingInputs {
  return { liquidResistance: "", tightnessDecay: "", airLiquidRatio: "" };
}

function parseReadings(inputs: ReadingInputs): Readings {
  return {
    liquidResistance: Number(inputs.liquidResistance),
    tightnessDecay: Number(inputs.tightnessDecay),
    airLiquidRatio: Number(inputs.airLiquidRatio),
  };
}

interface DetectionFormProps {
  onSubmit: (draft: DetectionDraft) => void;
}

/** 新增检测（初检）：任一指标越限即进入待复测，须填责任人与期限 */
export function DetectionForm({ onSubmit }: DetectionFormProps) {
  const [area, setArea] = useState("");
  const [nozzle, setNozzle] = useState("");
  const [readings, setReadings] = useState<ReadingInputs>(blankReadings);
  const [owner, setOwner] = useState("");
  const [deadline, setDeadline] = useState("");
  const [note, setNote] = useState("");

  const nozzles = nozzlesOf(area);
  const filled = METRIC_RULES.every((rule) => readings[rule.key].trim() !== "" && Number.isFinite(Number(readings[rule.key])));
  const violations = useMemo(() => (filled ? findViolations(parseReadings(readings)) : []), [filled, readings]);
  const overLimit = violations.length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!filled) return;
    onSubmit({
      area,
      nozzle,
      readings: parseReadings(readings),
      owner: overLimit ? owner.trim() : null,
      deadline: overLimit ? deadline : null,
      note: note.trim(),
    });
    setArea("");
    setNozzle("");
    setReadings(blankReadings());
    setOwner("");
    setDeadline("");
    setNote("");
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2>{project.formTitle}</h2>
      <div className="form-grid">
        <label>
          区域
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
        </label>
        <label>
          枪号
          <select value={nozzle} onChange={(event) => setNozzle(event.target.value)} required disabled={!area}>
            <option value="">{area ? "请选择枪号" : "先选区域"}</option>
            {nozzles.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
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

        {filled &&
          (overLimit ? (
            <p className="hint warn">
              越限指标：{violations.map((key) => ruleOf(key).label).join("、")}，本单将进入待复测，请落实责任人与期限。
            </p>
          ) : (
            <p className="hint ok">三项指标全部合限，登记后为正常单。</p>
          ))}

        {overLimit && (
          <div className="inline-fields">
            <label>
              责任人
              <input value={owner} onChange={(event) => setOwner(event.target.value)} required />
            </label>
            <label>
              复测期限
              <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} required />
            </label>
          </div>
        )}

        <label>
          备注
          <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="填写现场情况或处理说明" />
        </label>
        <button type="submit">{project.primaryAction}</button>
      </div>
    </form>
  );
}
