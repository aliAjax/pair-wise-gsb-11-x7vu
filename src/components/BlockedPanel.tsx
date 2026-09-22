import type { BlockedItem } from "../rules/chain";
import { formatValue } from "../rules/metrics";

interface BlockedPanelProps {
  items: BlockedItem[];
}

/** 受阻项：待复测链的越限指标，列出枪号、指标、原值、限值与规则 */
export function BlockedPanel({ items }: BlockedPanelProps) {
  return (
    <section className="panel">
      <h2>受阻项（待复测越限指标）</h2>
      {items.length === 0 ? (
        <div className="empty">暂无受阻项</div>
      ) : (
        <div className="table-wrap">
          <table className="blocked-table">
            <thead>
              <tr>
                <th>枪号</th>
                <th>指标</th>
                <th>原值</th>
                <th>最新值</th>
                <th>限值</th>
                <th>规则</th>
                <th>责任人</th>
                <th>期限</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`${item.rootId}-${item.metricKey}`}>
                  <td>
                    {item.area} / {item.nozzle}
                  </td>
                  <td>{item.metricLabel}</td>
                  <td className="violation">{formatValue(item.metricKey, item.originalValue)}</td>
                  <td className="violation">{formatValue(item.metricKey, item.latestValue)}</td>
                  <td>{item.limitText}</td>
                  <td>{item.ruleText}</td>
                  <td>{item.owner}</td>
                  <td>{item.deadline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
