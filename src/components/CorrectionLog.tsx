import { METRIC_RULES, formatValue } from "../rules/metrics";
import type { Correction, DetectionOrder } from "../types";
import { formatTime } from "../utils";

function oldVersionSummary(order: DetectionOrder): string {
  const readings = METRIC_RULES.map((rule) => `${rule.label} ${formatValue(rule.key, order.readings[rule.key])}`).join(" · ");
  const duty = order.owner || order.deadline ? ` · 责任人 ${order.owner ?? "—"} · 期限 ${order.deadline ?? "—"}` : "";
  return `${order.area} / ${order.nozzle} · ${readings}${duty}`;
}

interface CorrectionLogProps {
  corrections: Correction[];
}

/** 更正记录：原因与旧版快照另存于此 */
export function CorrectionLog({ corrections }: CorrectionLogProps) {
  return (
    <section className="panel">
      <h2>更正记录（原因与旧版）</h2>
      {corrections.length === 0 ? (
        <div className="empty">暂无更正记录</div>
      ) : (
        <div className="log-list">
          {corrections.map((correction) => (
            <div className="log-item" key={correction.id}>
              <div className="history-head">
                <span className="reason">{correction.reason}</span>
                <span className="history-time">{formatTime(correction.correctedAt)}</span>
              </div>
              <p className="old">
                旧版（单号 {correction.orderId.slice(0, 8)}）：{oldVersionSummary(correction.previous)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
