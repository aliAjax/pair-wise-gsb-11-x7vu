import { useState } from "react";
import type { Chain, Correction, DetectionEntry } from "../data/types";
import { isOpen, isOverdue } from "../rules/chain";
import { ChainTimeline } from "./ChainTimeline";
import { CorrectionForm, CorrectionPatch } from "./CorrectionForm";
import { RetestForm } from "./RetestForm";
import { StatusBadge } from "./StatusBadge";

type Mode = "none" | "retest" | "correct";

export function ChainCard({
  chain,
  corrections,
  onRetest,
  onCorrect,
  onRemove,
}: {
  chain: Chain;
  corrections: Correction[];
  onRetest: (entry: DetectionEntry) => void;
  onCorrect: (entryId: string, patch: CorrectionPatch) => void;
  onRemove: (chainId: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("none");
  const open = isOpen(chain);
  const chainCorrections = corrections.filter((item) => item.chainId === chain.root.chainId);
  const failing = chain.latest.verdicts.filter((verdict) => !verdict.pass);

  function close() {
    setMode("none");
  }

  return (
    <article className="record chain-card">
      <div className="record-head">
        <p className="record-title">{chain.root.area} / {chain.root.gunNo}</p>
        <StatusBadge status={chain.status} />
      </div>
      <div className="details">
        <span>轮次: 共 {chain.entries.length} 轮（{chain.entries.length - 1} 次复测）</span>
        <span>最近检测: {chain.latest.checkedAt} · {chain.latest.inspector}</span>
        {chain.latest.responsible && <span>责任人: {chain.latest.responsible}</span>}
        {chain.latest.deadline && (
          <span className={open && isOverdue(chain.latest.deadline) ? "overdue" : ""}>
            期限: {chain.latest.deadline}{open && isOverdue(chain.latest.deadline) ? "（已逾期）" : ""}
          </span>
        )}
      </div>
      {open && failing.length > 0 && (
        <p className="warn">
          越限项：{failing.map((verdict) => `${verdict.label} ${verdict.value}${verdict.unit ? ` ${verdict.unit}` : ""}（限值 ${verdict.limitText}）`).join("；")}
          ，未闭环前不计入正常数。
        </p>
      )}
      <ChainTimeline chain={chain} corrections={chainCorrections} />
      <div className="actions">
        {open && (
          <button type="button" onClick={() => setMode(mode === "retest" ? "none" : "retest")}>
            登记复测
          </button>
        )}
        <button type="button" className="secondary" onClick={() => setMode(mode === "correct" ? "none" : "correct")}>
          更正最新记录
        </button>
        <button
          type="button"
          className="danger"
          onClick={() => {
            if (window.confirm("确定删除该检测链及其全部复测、更正记录？")) {
              onRemove(chain.root.chainId);
            }
          }}
        >
          删除该链
        </button>
      </div>
      {mode === "retest" && open && (
        <RetestForm
          chain={chain}
          onSubmit={(entry) => {
            onRetest(entry);
            close();
          }}
          onCancel={close}
        />
      )}
      {mode === "correct" && (
        <CorrectionForm
          entry={chain.latest}
          onSubmit={(patch) => {
            onCorrect(chain.latest.id, patch);
            close();
          }}
          onCancel={close}
        />
      )}
    </article>
  );
}
