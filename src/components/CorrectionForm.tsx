import { FormEvent, useState } from "react";
import type { DetectionEntry, MetricValues } from "../data/types";
import { evaluateMetrics, isPass } from "../rules/metricRules";
import { draftFromMetrics, MetricDraft, MetricInputs, parseMetrics, VerdictList } from "./MetricInputs";

export interface CorrectionPatch {
  metrics: MetricValues;
  notes: string;
  responsible: string;
  deadline: string;
  reason: string;
}

/** 更正最新记录：原因必填，旧版数据与原因另存留痕 */
export function CorrectionForm({
  entry,
  onSubmit,
  onCancel,
}: {
  entry: DetectionEntry;
  onSubmit: (patch: CorrectionPatch) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<MetricDraft>(draftFromMetrics(entry.metrics));
  const [notes, setNotes] = useState(entry.notes);
  const [responsible, setResponsible] = useState(entry.responsible);
  const [deadline, setDeadline] = useState(entry.deadline);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const metrics = parseMetrics(draft);
  const willFail = metrics ? !isPass(evaluateMetrics(metrics)) : false;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!metrics) {
      setError("请完整填写三项指标");
      return;
    }
    if (!reason.trim()) {
      setError("更正必须填写原因，旧版数据将另存留痕");
      return;
    }
    if (willFail) {
      if (!responsible.trim()) {
        setError("更正后仍越限，须填写责任人");
        return;
      }
      if (!deadline) {
        setError("更正后仍越限，须填写期限");
        return;
      }
    }
    onSubmit({
      metrics,
      notes: notes.trim(),
      responsible: willFail ? responsible.trim() : "",
      deadline: willFail ? deadline : "",
      reason: reason.trim(),
    });
  }

  return (
    <form className="form-inline" onSubmit={handleSubmit}>
      <h3>更正最新记录 · {entry.area} {entry.gunNo}</h3>
      <MetricInputs draft={draft} onChange={setDraft} />
      {metrics && <VerdictList metrics={metrics} />}
      {willFail && (
        <div className="form-row">
          <label>
            责任人
            <input value={responsible} onChange={(event) => setResponsible(event.target.value)} />
          </label>
          <label>
            期限
            <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
          </label>
        </div>
      )}
      <label>
        备注
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>
      <label>
        更正原因（必填，随旧版另存）
        <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="如：抄表误读，现场复核确认" />
      </label>
      {error && <p className="error-text">{error}</p>}
      <div className="actions">
        <button type="submit">保存更正</button>
        <button type="button" className="secondary" onClick={onCancel}>取消</button>
      </div>
    </form>
  );
}
