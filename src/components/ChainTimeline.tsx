import type { Chain, Correction } from "../data/types";
import { roundLabel } from "../rules/chain";
import { METRIC_RULES } from "../rules/metricRules";

function formatTime(iso: string): string {
  return iso.replace("T", " ").slice(0, 16);
}

/** 复测链时间线：逐轮保留新旧检测值，并附更正留痕（原因 + 旧版） */
export function ChainTimeline({
  chain,
  corrections,
}: {
  chain: Chain;
  corrections: Correction[];
}) {
  return (
    <ol className="timeline">
      {chain.entries.map((entry) => (
        <li key={entry.id}>
          <div className="timeline-head">
            <strong>{roundLabel(entry)}</strong>
            <span>{entry.checkedAt} · {entry.inspector}</span>
            <span className={entry.pass ? "mini-badge mini-pass" : "mini-badge mini-fail"}>
              {entry.pass ? "合限" : "越限"}
            </span>
          </div>
          <div className="timeline-metrics">
            {entry.verdicts.map((verdict) => (
              <span key={verdict.key} className={verdict.pass ? "" : "bad"}>
                {verdict.label} {verdict.value}{verdict.unit ? ` ${verdict.unit}` : ""}
              </span>
            ))}
          </div>
          {entry.responsible && (
            <p className="timeline-meta">责任人 {entry.responsible} · 期限 {entry.deadline}</p>
          )}
          <p className="timeline-note">{entry.notes}</p>
          {corrections
            .filter((correction) => correction.entryId === entry.id)
            .map((correction) => (
              <div className="correction" key={correction.id}>
                <span>
                  <strong>更正</strong>（{formatTime(correction.correctedAt)}）：{correction.reason}
                </span>
                <span>
                  旧版：
                  {METRIC_RULES.map((rule) =>
                    `${rule.label} ${correction.oldMetrics[rule.key]}${rule.unit ? ` ${rule.unit}` : ""}`
                  ).join("、")}
                  （{correction.oldPass ? "合限" : "越限"}）· 旧备注：{correction.oldNotes || "无"}
                </span>
              </div>
            ))}
        </li>
      ))}
    </ol>
  );
}
