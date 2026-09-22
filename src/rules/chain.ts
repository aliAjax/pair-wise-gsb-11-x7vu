import type { Chain, ChainStatus, DetectionEntry, MetricVerdict } from "../data/types";

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isOverdue(deadline: string): boolean {
  return Boolean(deadline) && deadline < todayStr();
}

export function roundLabel(entry: DetectionEntry): string {
  return entry.round === 1 ? "初检" : `第${entry.round - 1}次复测`;
}

function sortChainEntries(entries: DetectionEntry[]): DetectionEntry[] {
  return [...entries].sort(
    (a, b) => a.round - b.round || a.createdAt.localeCompare(b.createdAt)
  );
}

/** 链状态完全由最新一条记录的判定推导，杜绝手工“记正常” */
export function chainStatusOf(latest: DetectionEntry): ChainStatus {
  if (latest.pass) return latest.round === 1 ? "正常" : "已关闭";
  return latest.round === 1 ? "待复测" : "顺延复测";
}

export function buildChains(entries: DetectionEntry[]): Chain[] {
  const byChain = new Map<string, DetectionEntry[]>();
  for (const entry of entries) {
    const list = byChain.get(entry.chainId) ?? [];
    list.push(entry);
    byChain.set(entry.chainId, list);
  }
  const chains: Chain[] = [];
  for (const list of byChain.values()) {
    const ordered = sortChainEntries(list);
    const root = ordered[0];
    const latest = ordered[ordered.length - 1];
    chains.push({ root, entries: ordered, latest, status: chainStatusOf(latest) });
  }
  return chains.sort((a, b) => b.latest.createdAt.localeCompare(a.latest.createdAt));
}

export function isOpen(chain: Chain): boolean {
  return chain.status === "待复测" || chain.status === "顺延复测";
}

/** 同一区域同一枪号存在未闭环链时，该枪受阻，只能登记关联复测 */
export function openChainForGun(chains: Chain[], area: string, gunNo: string): Chain | undefined {
  return chains.find((chain) => isOpen(chain) && chain.root.area === area && chain.root.gunNo === gunNo);
}

export interface ChainStats {
  total: number;
  normal: number;
  pending: number;
  extended: number;
  closed: number;
  retests: number;
}

export function computeStats(chains: Chain[]): ChainStats {
  return {
    total: chains.length,
    normal: chains.filter((chain) => chain.status === "正常").length,
    pending: chains.filter((chain) => chain.status === "待复测").length,
    extended: chains.filter((chain) => chain.status === "顺延复测").length,
    closed: chains.filter((chain) => chain.status === "已关闭").length,
    retests: chains.reduce((acc, chain) => acc + chain.entries.length - 1, 0),
  };
}

export interface BlockedItem {
  chainId: string;
  area: string;
  gunNo: string;
  status: ChainStatus;
  metricLabel: string;
  originalText: string;
  latestText: string;
  limitText: string;
  ruleText: string;
  responsible: string;
  deadline: string;
}

function formatVerdict(verdict: MetricVerdict): string {
  return `${verdict.value}${verdict.unit ? ` ${verdict.unit}` : ""}`;
}

/** 受阻项：未闭环链最新记录中越限的指标，列出枪号、指标、原值、限值与规则 */
export function collectBlockedItems(chains: Chain[]): BlockedItem[] {
  const items: BlockedItem[] = [];
  for (const chain of chains) {
    if (!isOpen(chain)) continue;
    for (const verdict of chain.latest.verdicts) {
      if (verdict.pass) continue;
      const original = chain.root.verdicts.find((item) => item.key === verdict.key);
      items.push({
        chainId: chain.root.chainId,
        area: chain.root.area,
        gunNo: chain.root.gunNo,
        status: chain.status,
        metricLabel: verdict.label,
        originalText: original ? formatVerdict(original) : "-",
        latestText: formatVerdict(verdict),
        limitText: verdict.limitText,
        ruleText: verdict.ruleText,
        responsible: chain.latest.responsible,
        deadline: chain.latest.deadline,
      });
    }
  }
  return items;
}
