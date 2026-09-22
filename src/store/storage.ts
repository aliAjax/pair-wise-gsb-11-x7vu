import { project } from "../data/config";
import { seedState } from "../data/seed";
import type { PersistedState } from "../types";

/** 读取持久化状态；缺失或损坏时回退到种子数据，保证重载后统计一致 */
export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(project.storageKey);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.orders)) {
      return seedState();
    }
    return {
      version: 1,
      orders: parsed.orders,
      corrections: Array.isArray(parsed.corrections) ? parsed.corrections : [],
    };
  } catch {
    return seedState();
  }
}

export function saveState(state: PersistedState): void {
  localStorage.setItem(project.storageKey, JSON.stringify(state));
}
