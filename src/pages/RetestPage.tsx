import { ChainCard } from "../components/ChainCard";
import { CorrectionPatch } from "../components/CorrectionForm";
import type { Chain, Correction, DetectionEntry } from "../data/types";
import { isOpen } from "../rules/chain";

export function RetestPage({
  chains,
  corrections,
  onRetest,
  onCorrect,
  onRemove,
}: {
  chains: Chain[];
  corrections: Correction[];
  onRetest: (entry: DetectionEntry) => void;
  onCorrect: (entryId: string, patch: CorrectionPatch) => void;
  onRemove: (chainId: string) => void;
}) {
  const openChains = chains.filter(isOpen);
  const historyChains = chains.filter((chain) => !isOpen(chain));
  const normalCount = historyChains.filter((chain) => chain.status === "正常").length;
  const closedCount = historyChains.filter((chain) => chain.status === "已关闭").length;

  return (
    <section className="page">
      <div className="toolbar">
        <h2>待复测单（{openChains.length}）</h2>
        <p className="hint">未闭环单只能登记关联原单的复测；全部合限后原单自动关闭。</p>
      </div>
      <div className="record-grid">
        {openChains.length === 0 ? (
          <div className="empty">当前无待复测单，越限单均已闭环</div>
        ) : (
          openChains.map((chain) => (
            <ChainCard
              key={chain.root.chainId}
              chain={chain}
              corrections={corrections}
              onRetest={onRetest}
              onCorrect={onCorrect}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      <details className="history">
        <summary>历史单（初检正常 {normalCount} · 复测合格关闭 {closedCount}）</summary>
        <div className="record-grid history-grid">
          {historyChains.length === 0 ? (
            <div className="empty">暂无历史单</div>
          ) : (
            historyChains.map((chain) => (
              <ChainCard
                key={chain.root.chainId}
                chain={chain}
                corrections={corrections}
                onRetest={onRetest}
                onCorrect={onCorrect}
                onRemove={onRemove}
              />
            ))
          )}
        </div>
      </details>
    </section>
  );
}
