import { useCallback, useEffect, useState } from "react";
import type { NeedCategory, PatientLocation, Resource, TravelMode } from "./halo";

export interface StoredSearch {
  location: PatientLocation;
  needs: NeedCategory[];
  mode: TravelMode;
  maxMinutes: number;
  language?: string;
  noIdOnly?: boolean;
}

const SEARCH_KEY = "halo.search";
const PLAN_KEY = "halo.plan";
const RESOURCES_KEY = "halo.resources";

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("halo:store"));
}

export function saveSearch(s: StoredSearch) {
  write(SEARCH_KEY, s);
}

export function useSearch() {
  const [search, setSearch] = useState<StoredSearch | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setSearch(read<StoredSearch>(SEARCH_KEY));
    setReady(true);
  }, []);
  return { search, ready, setSearch: (s: StoredSearch) => (saveSearch(s), setSearch(s)) };
}

export function usePlan() {
  const [plan, setPlan] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setPlan(read<string[]>(PLAN_KEY) ?? []);
    sync();
    setReady(true);
    window.addEventListener("halo:store", sync);
    return () => window.removeEventListener("halo:store", sync);
  }, []);

  const persist = useCallback((next: string[]) => {
    setPlan(next);
    write(PLAN_KEY, next);
  }, []);

  const toggle = useCallback(
    (id: string) => persist(plan.includes(id) ? plan.filter((x) => x !== id) : [...plan, id]),
    [plan, persist],
  );
  const remove = useCallback((id: string) => persist(plan.filter((x) => x !== id)), [plan, persist]);
  const move = useCallback(
    (id: string, dir: -1 | 1) => {
      const i = plan.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= plan.length) return;
      const next = [...plan];
      const a = next[i]!;
      const b = next[j]!;
      next[i] = b;
      next[j] = a;
      persist(next);
    },
    [plan, persist],
  );
  const clear = useCallback(() => persist([]), [persist]);

  return { plan, ready, toggle, remove, move, clear };
}
