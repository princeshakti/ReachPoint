import { useCallback } from "react";
import { createSessionStore, useSessionStore } from "@/lib/session-store";
import type { Resource } from "@/lib/types";

const EMPTY_PLAN: Resource[] = [];
const planStore = createSessionStore<Resource[]>("reachpoint:plan:v2", EMPTY_PLAN);

export function clearPlan() {
  planStore.write(null);
}

/**
 * The patient plan. It stores whole resources rather than IDs, so the plan
 * stays intact when the search changes and the results list is replaced.
 */
export function usePlan() {
  const plan = useSessionStore(planStore);

  const toggle = useCallback((resource: Resource) => {
    const current = planStore.read();
    const inPlan = current.some((item) => item.id === resource.id);
    planStore.write(inPlan ? current.filter((item) => item.id !== resource.id) : [...current, resource]);
  }, []);

  const remove = useCallback((id: string) => {
    planStore.write(planStore.read().filter((item) => item.id !== id));
  }, []);

  const move = useCallback((id: string, direction: -1 | 1) => {
    const items = [...planStore.read()];
    const from = items.findIndex((item) => item.id === id);
    const to = from + direction;
    const moved = items[from];
    const displaced = items[to];
    if (!moved || !displaced) return;
    items[from] = displaced;
    items[to] = moved;
    planStore.write(items);
  }, []);

  const clear = useCallback(() => clearPlan(), []);

  return { plan, toggle, remove, move, clear };
}
