import { Chain, CHAIN_STATUS_TEXT, effectiveDeadline, effectiveOwner } from "../rules/chain";
import { METRIC_RULES, formatValue, ruleOf } from "../rules/metrics";
import type { DetectionOrder } from "../types";
import { formatTime } from "../utils";

interface ChainCardProps {
  chain: Chain;
  onAddRetest: (rootId: string) => void;
  onCorrect: (orderId: string) => void;
  onDeleteChain: (rootId: string) => void;
}

function orderLabel(order: DetectionOrder): string {
  return order.kind === "initial" ? "初检" : `第 ${order.seq - 1} 次复测`;
}

/** 检测链卡片：展示新旧值历史；待复测链仅提供“新增复测”，不提供记正常入口 */
export function ChainCard({ chain, onAddRetest, onCorrect, onDeleteChain }: ChainCardProps) {
  const pending = chain.status === "pending";

  return (
    <article className="record">
      <div className="record-head">
        <p className="record-title">
          {chain.root.area} / {chain.root.nozzle}
        </p>
        <span className={`status ${chain.status}`}>{CHAIN_STATUS_TEXT[chain.status]}</span>
      </div>

      <div className="chain-meta">
        <span>原单号：{chain.root.id.slice(0, 8)}</span>
        <span>复测次数：{chain.retestCount}</span>
        {chain.status !== "normal" && (
          <>
            <span>责任人：{effectiveOwner(chain)}</span>
            <span>期限：{effectiveDeadline(chain)}</span>
          </>
        )}
      </div>

      {pending && <p className="hint warn">待复测：仅可新增关联原单的复测，不记正常、不计入合格数。</p>}

      <div className="history">
        {chain.orders.map((order) => (
          <div className="history-item" key={order.id}>
            <div className="history-head">
              <span className="history-tag">{orderLabel(order)}</span>
              <span className="history-time">{formatTime(order.createdAt)}</span>
            </div>
            <div className="readings">
              {METRIC_RULES.map((rule) => {
                const violated = order.violations.includes(rule.key);
                return (
                  <span key={rule.key} className={violated ? "violation" : ""}>
                    {rule.label} {formatValue(rule.key, order.readings[rule.key])}
                    {violated ? "（越限）" : ""}
                  </span>
                );
              })}
            </div>
            {order.violations.length > 0 && (
              <div className="violation-tags">
                {order.violations.map((key) => (
                  <span className="violation-tag" key={key}>
                    {ruleOf(key).label}越限
                  </span>
                ))}
              </div>
            )}
            {(order.owner || order.deadline) && (
              <div className="chain-meta">
                {order.owner && <span>责任人：{order.owner}</span>}
                {order.deadline && <span>期限：{order.deadline}</span>}
              </div>
            )}
            <p className="note">{order.note || "暂无备注"}</p>
            <div className="actions">
              <button type="button" className="secondary" onClick={() => onCorrect(order.id)}>
                更正
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="actions">
        {pending && (
          <button type="button" onClick={() => onAddRetest(chain.root.id)}>
            新增复测
          </button>
        )}
        <button type="button" className="danger" onClick={() => onDeleteChain(chain.root.id)}>
          删除链
        </button>
      </div>
    </article>
  );
}
