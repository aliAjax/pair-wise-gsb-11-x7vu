import type { DetectionOrder, MetricKey } from "../types";
import { ruleOf } from "./metrics";

export type ChainStatus = "normal" | "pending" | "closed";

export const CHAIN_STATUS_TEXT: Record<ChainStatus, string> = {
  normal: "正常",
  pending: "待复测",
  closed: "已关闭",
};

/** 一条复测链：初检原单 + 依次关联的复测单 */
export interface Chain {
  root: DetectionOrder;
  /** 按 seq 升序，首条为初检 */
  orders: DetectionOrder[];
  latest: DetectionOrder;
  status: ChainStatus;
  retestCount: number;
}

/**
 * 链状态推导（唯一入口，保证重载后统计一致）：
 * - 初检全部合限 → 正常
 * - 最新一单全部合限 → 已关闭（复测/更正合格）
 * - 否则 → 待复测（不计入合格数，仅可新增关联复测）
 */
export function buildChains(orders: DetectionOrder[]): Chain[] {
  const byRoot = new Map<string, DetectionOrder[]>();
  for (const order of orders) {
    const list = byRoot.get(order.rootId) ?? [];
    list.push(order);
    byRoot.set(order.rootId, list);
  }

  const chains: Chain[] = [];
  for (const list of byRoot.values()) {
    const chainOrders = list.slice().sort((a, b) => a.seq - b.seq);
    const root = chainOrders.find((order) => order.kind === "initial") ?? chainOrders[0];
    const latest = chainOrders[chainOrders.length - 1];
    const status: ChainStatus =
      root.violations.length === 0 ? "normal" : latest.violations.length === 0 ? "closed" : "pending";
    chains.push({ root, orders: chainOrders, latest, status, retestCount: chainOrders.length - 1 });
  }

  return chains.sort((a, b) => b.root.createdAt.localeCompare(a.root.createdAt));
}

export interface ChainStats {
  total: number;
  normal: number;
  closed: number;
  pending: number;
  /** 合格数 = 正常 + 已关闭；待复测不计入 */
  qualified: number;
  retests: number;
  blocked: number;
}

export function computeStats(chains: Chain[]): ChainStats {
  const normal = chains.filter((chain) => chain.status === "normal").length;
  const closed = chains.filter((chain) => chain.status === "closed").length;
  const pending = chains.filter((chain) => chain.status === "pending").length;
  return {
    total: chains.length,
    normal,
    closed,
    pending,
    qualified: normal + closed,
    retests: chains.reduce((sum, chain) => sum + chain.retestCount, 0),
    blocked: chains.reduce(
      (sum, chain) => sum + (chain.status === "pending" ? chain.latest.violations.length : 0),
      0
    ),
  };
}

/** 受阻项：待复测链最新单的越限指标，含枪号、指标、原值、限值与规则 */
export interface BlockedItem {
  rootId: string;
  area: string;
  nozzle: string;
  metricKey: MetricKey;
  metricLabel: string;
  originalValue: number;
  latestValue: number;
  limitText: string;
  ruleText: string;
  owner: string;
  deadline: string;
}

export function collectBlockedItems(chains: Chain[]): BlockedItem[] {
  const items: BlockedItem[] = [];
  for (const chain of chains) {
    if (chain.status !== "pending") continue;
    for (const key of chain.latest.violations) {
      const rule = ruleOf(key);
      items.push({
        rootId: chain.root.id,
        area: chain.root.area,
        nozzle: chain.root.nozzle,
        metricKey: key,
        metricLabel: rule.label,
        originalValue: chain.root.readings[key],
        latestValue: chain.latest.readings[key],
        limitText: rule.limitText,
        ruleText: rule.ruleText,
        owner: chain.latest.owner ?? chain.root.owner ?? "未指派",
        deadline: chain.latest.deadline ?? chain.root.deadline ?? "未设期限",
      });
    }
  }
  return items;
}

/** 链当前生效的责任人 / 期限（取最新单，回退到原单） */
export function effectiveOwner(chain: Chain): string {
  return chain.latest.owner ?? chain.root.owner ?? "未指派";
}

export function effectiveDeadline(chain: Chain): string {
  return chain.latest.deadline ?? chain.root.deadline ?? "未设期限";
}
