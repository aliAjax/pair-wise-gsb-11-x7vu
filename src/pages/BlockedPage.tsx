import { StatusBadge } from "../components/StatusBadge";
import type { Chain } from "../data/types";
import { collectBlockedItems, isOverdue } from "../rules/chain";
import { METRIC_RULES } from "../rules/metricRules";

export function BlockedPage({ chains }: { chains: Chain[] }) {
  const items = collectBlockedItems(chains);
  const gunCount = new Set(items.map((item) => `${item.area}/${item.gunNo}`)).size;

  return (
    <section className="page">
      <div className="toolbar">
        <h2>受阻项（{items.length}）</h2>
        <p className="hint">涉及 {gunCount} 把油枪；受阻枪号在闭环前不能登记新的初检，只能复测。</p>
      </div>
      {items.length === 0 ? (
        <div className="empty">当前无受阻项，所有检测单均已合限闭环</div>
      ) : (
        <div className="table-wrap">
          <table className="blocked-table">
            <thead>
              <tr>
                <th>区域</th>
                <th>枪号</th>
                <th>指标</th>
                <th>原值</th>
                <th>最新值</th>
                <th>限值</th>
                <th>规则</th>
                <th>状态</th>
                <th>责任人</th>
                <th>期限</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`${item.chainId}-${item.metricLabel}`}>
                  <td>{item.area}</td>
                  <td>{item.gunNo}</td>
                  <td>{item.metricLabel}</td>
                  <td>{item.originalText}</td>
                  <td className="bad-text">{item.latestText}</td>
                  <td>{item.limitText}</td>
                  <td className="rule-cell">{item.ruleText}</td>
                  <td><StatusBadge status={item.status} /></td>
                  <td>{item.responsible}</td>
                  <td className={isOverdue(item.deadline) ? "overdue" : ""}>{item.deadline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rules-ref">
        <h3>判定规则</h3>
        {METRIC_RULES.map((rule) => (
          <p key={rule.key}>
            <strong>{rule.label}</strong>：{rule.ruleText}（限值 {rule.limitText}）
          </p>
        ))}
        <p>任一指标越限即进入待复测；复测仍越限保留新旧值并顺延期限；全部合限才关闭原单。</p>
      </div>
    </section>
  );
}
