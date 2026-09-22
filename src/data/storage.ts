import { project, seedState } from "./config";
import type { PersistedState } from "./types";

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(project.storageKey);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as PersistedState;
    if (!Array.isArray(parsed.entries) || !Array.isArray(parsed.corrections)) {
      return seedState();
    }
    return parsed;
  } catch {
    return seedState();
  }
}

export function saveState(state: PersistedState) {
  localStorage.setItem(project.storageKey, JSON.stringify(state));
}
