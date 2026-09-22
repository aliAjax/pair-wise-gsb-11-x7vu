import { useMemo, useState } from "react";
import { CorrectionPatch } from "./components/CorrectionForm";
import { project, TABS, TabKey } from "./data/config";
import { loadState, saveState } from "./data/storage";
import type { Correction, DetectionEntry, PersistedState } from "./data/types";
import { BlockedPage } from "./pages/BlockedPage";
import { DetectionPage } from "./pages/DetectionPage";
import { RetestPage } from "./pages/RetestPage";
import { buildChains, collectBlockedItems, computeStats } from "./rules/chain";
import { evaluateMetrics, isPass } from "./rules/metricRules";

export default function App() {
  const [state, setState] = useState<PersistedState>(loadState);
  const [tab, setTab] = useState<TabKey>(TABS[0]);

  const chains = useMemo(() => buildChains(state.entries), [state.entries]);
  const stats = useMemo(() => computeStats(chains), [chains]);
  const blockedCount = useMemo(() => collectBlockedItems(chains).length, [chains]);

  function update(next: PersistedState) {
    setState(next);
    saveState(next);
  }

  function addEntry(entry: DetectionEntry) {
    update({ ...state, entries: [entry, ...state.entries] });
  }

  function correctEntry(entryId: string, patch: CorrectionPatch) {
    const target = state.entries.find((entry) => entry.id === entryId);
    if (!target) return;
    const verdicts = evaluateMetrics(patch.metrics);
    const correction: Correction = {
      id: crypto.randomUUID(),
      entryId,
      chainId: target.chainId,
      reason: patch.reason,
      oldMetrics: target.metrics,
      oldNotes: target.notes,
      oldPass: target.pass,
      correctedAt: new Date().toISOString(),
    };
    update({
      entries: state.entries.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              metrics: patch.metrics,
              notes: patch.notes,
              responsible: patch.responsible,
              deadline: patch.deadline,
              verdicts,
              pass: isPass(verdicts),
            }
          : entry
      ),
      corrections: [correction, ...state.corrections],
    });
  }

  function removeChain(chainId: string) {
    update({
      entries: state.entries.filter((entry) => entry.chainId !== chainId),
      corrections: state.corrections.filter((correction) => correction.chainId !== chainId),
    });
  }

  const metricCards: [string, number][] = [
    ["检测单（链）", stats.total],
    ["初检正常", stats.normal],
    ["待复测", stats.pending],
    ["顺延复测", stats.extended],
    ["复测合格关闭", stats.closed],
    ["受阻项", blockedCount],
  ];

  return (
    <main className="app">
      <div className="shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">{project.industry}行业前端最小闭环</p>
            <h1>{project.title}</h1>
            <p className="subtitle">{project.subtitle}</p>
          </div>
          <div className="stack">{project.stack.map((item) => <span className="tag" key={item}>{item}</span>)}</div>
        </header>

        <section className="metrics">
          {metricCards.map(([label, value]) => (
            <article className="metric" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </section>

        <nav className="tabs">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              className={`tab ${tab === item ? "active" : ""}`}
              onClick={() => setTab(item)}
            >
              {item}
              {item === "受阻项" && blockedCount > 0 ? `（${blockedCount}）` : ""}
            </button>
          ))}
        </nav>

        {tab === "检测登记" && (
          <DetectionPage chains={chains} entries={state.entries} onAdd={addEntry} />
        )}
        {tab === "复测台" && (
          <RetestPage
            chains={chains}
            corrections={state.corrections}
            onRetest={addEntry}
            onCorrect={correctEntry}
            onRemove={removeChain}
          />
        )}
        {tab === "受阻项" && <BlockedPage chains={chains} />}
      </div>
    </main>
  );
}
