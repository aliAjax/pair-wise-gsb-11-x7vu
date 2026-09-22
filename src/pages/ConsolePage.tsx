import { useMemo, useState } from "react";
import { BlockedPanel } from "../components/BlockedPanel";
import { ChainCard } from "../components/ChainCard";
import { CorrectionForm } from "../components/CorrectionForm";
import { CorrectionLog } from "../components/CorrectionLog";
import { DetectionForm } from "../components/DetectionForm";
import { MetricsBar } from "../components/MetricsBar";
import { RetestForm } from "../components/RetestForm";
import { AREA_FILTERS, STATUS_FILTERS, project } from "../data/config";
import { CHAIN_STATUS_TEXT, buildChains, collectBlockedItems, computeStats } from "../rules/chain";
import { findViolations } from "../rules/metrics";
import { loadState, saveState } from "../store/storage";
import type { Correction, CorrectionPatch, DetectionDraft, DetectionOrder, PersistedState } from "../types";
import { uid } from "../utils";

export default function ConsolePage() {
  const [state, setState] = useState<PersistedState>(loadState);
  const [areaFilter, setAreaFilter] = useState(AREA_FILTERS[0]);
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTERS[0]);
  const [retestRootId, setRetestRootId] = useState<string | null>(null);
  const [correctOrderId, setCorrectOrderId] = useState<string | null>(null);

  const chains = useMemo(() => buildChains(state.orders), [state.orders]);
  const stats = useMemo(() => computeStats(chains), [chains]);
  const blockedItems = useMemo(() => collectBlockedItems(chains), [chains]);

  const filteredChains = useMemo(
    () =>
      chains.filter((chain) => {
        if (areaFilter !== AREA_FILTERS[0] && chain.root.area !== areaFilter) return false;
        if (statusFilter !== STATUS_FILTERS[0] && CHAIN_STATUS_TEXT[chain.status] !== statusFilter) return false;
        return true;
      }),
    [chains, areaFilter, statusFilter]
  );

  const retestChain = retestRootId ? chains.find((chain) => chain.root.id === retestRootId) ?? null : null;
  const correctTarget = correctOrderId ? state.orders.find((order) => order.id === correctOrderId) ?? null : null;

  function update(next: PersistedState) {
    setState(next);
    saveState(next);
  }

  function addDetection(draft: DetectionDraft) {
    const id = uid();
    const order: DetectionOrder = {
      id,
      kind: "initial",
      rootId: id,
      seq: 1,
      area: draft.area,
      nozzle: draft.nozzle,
      readings: draft.readings,
      violations: findViolations(draft.readings),
      owner: draft.owner,
      deadline: draft.deadline,
      note: draft.note || "暂无备注",
      createdAt: new Date().toISOString(),
    };
    update({ ...state, orders: [order, ...state.orders] });
  }

  function addRetest(rootId: string, draft: DetectionDraft) {
    const chainOrders = state.orders.filter((order) => order.rootId === rootId);
    if (chainOrders.length === 0) return;
    const seq = Math.max(...chainOrders.map((order) => order.seq)) + 1;
    const order: DetectionOrder = {
      id: uid(),
      kind: "retest",
      rootId,
      seq,
      area: draft.area,
      nozzle: draft.nozzle,
      readings: draft.readings,
      violations: findViolations(draft.readings),
      owner: draft.owner,
      deadline: draft.deadline,
      note: draft.note || "暂无备注",
      createdAt: new Date().toISOString(),
    };
    update({ ...state, orders: [...state.orders, order] });
    setRetestRootId(null);
  }

  function correctOrder(orderId: string, patch: CorrectionPatch, reason: string) {
    const target = state.orders.find((order) => order.id === orderId);
    if (!target) return;
    const nextOrder: DetectionOrder = {
      ...target,
      area: patch.area,
      nozzle: patch.nozzle,
      readings: patch.readings,
      violations: findViolations(patch.readings),
      owner: patch.owner,
      deadline: patch.deadline,
      note: patch.note || target.note,
    };
    const correction: Correction = {
      id: uid(),
      orderId,
      rootId: target.rootId,
      reason,
      previous: target,
      correctedAt: new Date().toISOString(),
    };
    update({
      ...state,
      orders: state.orders.map((order) => (order.id === orderId ? nextOrder : order)),
      corrections: [correction, ...state.corrections],
    });
    setCorrectOrderId(null);
  }

  function deleteChain(rootId: string) {
    update({
      ...state,
      orders: state.orders.filter((order) => order.rootId !== rootId),
      corrections: state.corrections.filter((correction) => correction.rootId !== rootId),
    });
  }

  return (
    <main className="app">
      <div className="shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">{project.industry}行业前端最小闭环</p>
            <h1>{project.title}</h1>
            <p className="subtitle">{project.subtitle}</p>
          </div>
          <div className="stack">
            {project.stack.map((item) => (
              <span className="tag" key={item}>
                {item}
              </span>
            ))}
          </div>
        </header>

        <MetricsBar stats={stats} />

        <section className="workspace">
          <DetectionForm onSubmit={addDetection} />

          <section className="list-panel">
            <div className="toolbar">
              <h2>检测链列表</h2>
              <div className="filters">
                <select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)}>
                  {AREA_FILTERS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  {STATUS_FILTERS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="record-grid">
              {filteredChains.length === 0 ? (
                <div className="empty">暂无匹配数据</div>
              ) : (
                filteredChains.map((chain) => (
                  <ChainCard
                    key={chain.root.id}
                    chain={chain}
                    onAddRetest={setRetestRootId}
                    onCorrect={setCorrectOrderId}
                    onDeleteChain={deleteChain}
                  />
                ))
              )}
            </div>
          </section>
        </section>

        <div className="panels-below">
          <BlockedPanel items={blockedItems} />
          <CorrectionLog corrections={state.corrections} />
        </div>
      </div>

      {retestChain && (
        <div className="modal-mask">
          <div className="modal">
            <RetestForm chain={retestChain} onSubmit={(draft) => addRetest(retestChain.root.id, draft)} onCancel={() => setRetestRootId(null)} />
          </div>
        </div>
      )}

      {correctTarget && (
        <div className="modal-mask">
          <div className="modal">
            <CorrectionForm order={correctTarget} onSubmit={(patch, reason) => correctOrder(correctTarget.id, patch, reason)} onCancel={() => setCorrectOrderId(null)} />
          </div>
        </div>
      )}
    </main>
  );
}
