import { FormEvent, useState } from "react";
import type { Chain, DetectionEntry } from "../data/types";
import { todayStr } from "../rules/chain";
import { evaluateMetrics, isPass } from "../rules/metricRules";
import { emptyMetricDraft, MetricDraft, MetricInputs, parseMetrics, VerdictList } from "./MetricInputs";

/** 复测只能挂在既有链上：区域、枪号沿用原单，期限须顺延 */
export function RetestForm({
  chain,
  onSubmit,
  onCancel,
}: {
  chain: Chain;
  onSubmit: (entry: DetectionEntry) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<MetricDraft>(emptyMetricDraft);
  const [inspector, setInspector] = useState(chain.latest.inspector);
  const [checkedAt, setCheckedAt] = useState(todayStr());
  const [responsible, setResponsible] = useState(chain.latest.responsible);
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const metrics = parseMetrics(draft);
  const willFail = metrics ? !isPass(evaluateMetrics(metrics)) : false;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!metrics) {
      setError("请完整填写液阻、密闭性衰减与气液比");
      return;
    }
    const verdicts = evaluateMetrics(metrics);
    const pass = isPass(verdicts);
    if (!pass) {
      if (!responsible.trim()) {
        setError("复测仍越限，须填写责任人");
        return;
      }
      if (!deadline) {
        setError("复测仍越限，须填写顺延期限");
        return;
      }
      if (chain.latest.deadline && deadline <= chain.latest.deadline) {
        setError(`期限须顺延，请晚于上一期限 ${chain.latest.deadline}`);
        return;
      }
    }
    onSubmit({
      id: crypto.randomUUID(),
      chainId: chain.root.chainId,
      parentId: chain.latest.id,
      round: chain.latest.round + 1,
      kind: "复测",
      area: chain.root.area,
      gunNo: chain.root.gunNo,
      inspector: inspector.trim(),
      checkedAt,
      metrics,
      verdicts,
      pass,
      responsible: pass ? "" : responsible.trim(),
      deadline: pass ? "" : deadline,
      notes: notes.trim() || (pass ? "复测合格，原单关闭" : "复测仍越限，保留新旧值并顺延"),
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <form className="form-inline" onSubmit={handleSubmit}>
      <h3>登记复测 · {chain.root.area} {chain.root.gunNo}（第 {chain.latest.round} 轮后）</h3>
      <MetricInputs draft={draft} onChange={setDraft} />
      {metrics && <VerdictList metrics={metrics} />}
      <div className="form-row">
        <label>
          检测人
          <input value={inspector} onChange={(event) => setInspector(event.target.value)} required />
        </label>
        <label>
          检测日期
          <input type="date" value={checkedAt} onChange={(event) => setCheckedAt(event.target.value)} required />
        </label>
      </div>
      {willFail && (
        <div className="form-row">
          <label>
            责任人
            <input value={responsible} onChange={(event) => setResponsible(event.target.value)} placeholder="越限整改责任人" />
          </label>
          <label>
            顺延期限
            <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} min={chain.latest.deadline || undefined} />
          </label>
        </div>
      )}
      {willFail && <p className="warn">复测仍越限：新旧值将一并保留，期限须顺延。</p>}
      <label>
        备注
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="整改措施、检测条件等" />
      </label>
      {error && <p className="error-text">{error}</p>}
      <div className="actions">
        <button type="submit">提交复测</button>
        <button type="button" className="secondary" onClick={onCancel}>取消</button>
      </div>
    </form>
  );
}
