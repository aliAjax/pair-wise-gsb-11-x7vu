import { FormEvent, useMemo, useState } from "react";
import { AREAS } from "../data/config";
import type { Chain, DetectionEntry } from "../data/types";
import { openChainForGun, roundLabel, todayStr } from "../rules/chain";
import { evaluateMetrics, isPass } from "../rules/metricRules";
import { emptyMetricDraft, MetricDraft, MetricInputs, parseMetrics, VerdictList } from "../components/MetricInputs";

export function DetectionPage({
  chains,
  entries,
  onAdd,
}: {
  chains: Chain[];
  entries: DetectionEntry[];
  onAdd: (entry: DetectionEntry) => void;
}) {
  const [area, setArea] = useState("");
  const [gunNo, setGunNo] = useState("");
  const [inspector, setInspector] = useState("");
  const [checkedAt, setCheckedAt] = useState(todayStr());
  const [draft, setDraft] = useState<MetricDraft>(emptyMetricDraft);
  const [responsible, setResponsible] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");

  const guns = AREAS.find((item) => item.name === area)?.guns ?? [];
  const metrics = parseMetrics(draft);
  const willFail = metrics ? !isPass(evaluateMetrics(metrics)) : false;
  const blocking = area && gunNo ? openChainForGun(chains, area, gunNo) : undefined;

  const recent = useMemo(
    () => [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
    [entries]
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFlash("");
    if (blocking) {
      setError("该枪存在未闭环检测单，只能到复测台登记关联复测");
      return;
    }
    if (!metrics) {
      setError("请完整填写液阻、密闭性衰减与气液比");
      return;
    }
    const verdicts = evaluateMetrics(metrics);
    const pass = isPass(verdicts);
    if (!pass) {
      if (!responsible.trim()) {
        setError("存在越限项，须填写责任人");
        return;
      }
      if (!deadline) {
        setError("存在越限项，须填写整改期限");
        return;
      }
    }
    const id = crypto.randomUUID();
    onAdd({
      id,
      chainId: id,
      parentId: null,
      round: 1,
      kind: "初检",
      area,
      gunNo,
      inspector: inspector.trim(),
      checkedAt,
      metrics,
      verdicts,
      pass,
      responsible: pass ? "" : responsible.trim(),
      deadline: pass ? "" : deadline,
      notes: notes.trim() || (pass ? "初检全部合限" : "初检越限，转入待复测"),
      createdAt: new Date().toISOString(),
    });
    setFlash(pass ? "已登记：三项全部合限，计入正常。" : "已登记：存在越限项，已进入待复测（未闭环前不计入正常数）。");
    setError("");
    setGunNo("");
    setDraft(emptyMetricDraft);
    setResponsible("");
    setDeadline("");
    setNotes("");
  }

  return (
    <section className="workspace">
      <form className="panel" onSubmit={handleSubmit}>
        <h2>新增检测</h2>
        <div className="form-grid">
          <div className="form-row">
            <label>
              区域
              <select
                value={area}
                onChange={(event) => {
                  setArea(event.target.value);
                  setGunNo("");
                }}
                required
              >
                <option value="">请选择</option>
                {AREAS.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
              </select>
            </label>
            <label>
              枪号
              <select value={gunNo} onChange={(event) => setGunNo(event.target.value)} required disabled={!area}>
                <option value="">请选择</option>
                {guns.map((gun) => <option key={gun} value={gun}>{gun}</option>)}
              </select>
            </label>
          </div>
          {blocking && (
            <p className="warn">
              {area} {gunNo} 存在「{blocking.status}」未闭环单（责任人 {blocking.latest.responsible}，期限 {blocking.latest.deadline}），
              只能登记关联原单的复测，请前往「复测台」处理。
            </p>
          )}
          <MetricInputs draft={draft} onChange={setDraft} />
          {metrics && <VerdictList metrics={metrics} />}
          {willFail && (
            <div className="form-row">
              <label>
                责任人
                <input value={responsible} onChange={(event) => setResponsible(event.target.value)} placeholder="越限整改责任人" />
              </label>
              <label>
                整改期限
                <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
              </label>
            </div>
          )}
          {willFail && <p className="warn">任一指标越限即进入待复测，须填写责任人和期限。</p>}
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
          <label>
            备注
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="现场情况、设备状态等" />
          </label>
          {error && <p className="error-text">{error}</p>}
          {flash && <p className="flash">{flash}</p>}
          <button type="submit" disabled={Boolean(blocking)}>登记检测</button>
        </div>
      </form>

      <section className="list-panel">
        <div className="toolbar">
          <h2>最近检测动态</h2>
        </div>
        <div className="record-grid">
          {recent.length === 0 ? <div className="empty">暂无检测记录</div> : recent.map((entry) => (
            <article className="record" key={entry.id}>
              <div className="record-head">
                <p className="record-title">{entry.area} / {entry.gunNo}</p>
                <span className={`status ${entry.pass ? "st-ok" : "st-wait"}`}>
                  {roundLabel(entry)} · {entry.pass ? "合限" : "越限"}
                </span>
              </div>
              <div className="details">
                <span>检测日期: {entry.checkedAt}</span>
                <span>检测人: {entry.inspector}</span>
                {entry.verdicts.map((verdict) => (
                  <span key={verdict.key} className={verdict.pass ? "" : "bad-text"}>
                    {verdict.label}: {verdict.value}{verdict.unit ? ` ${verdict.unit}` : ""}
                  </span>
                ))}
              </div>
              <p className="note">{entry.notes}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
