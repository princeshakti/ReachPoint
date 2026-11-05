import { useCallback } from "react";
import { createSessionStore, useSessionStore } from "@/lib/session-store";
import type { SearchCriteria } from "@/lib/types";

const searchStore = createSessionStore<SearchCriteria | null>("reachpoint:search:v2", null);

export function readSearch(): SearchCriteria | null {
  return searchStore.read();
}

/** The current search, kept in sessionStorage so it survives moving between screens. */
export function useSearch() {
  const search = useSessionStore(searchStore);

  const saveSearch = useCallback((next: SearchCriteria) => searchStore.write(next), []);

  const updateSearch = useCallback((patch: Partial<Omit<SearchCriteria, "location">>) => {
    const current = searchStore.read();
    if (current) searchStore.write({ ...current, ...patch });
  }, []);

  return { search, saveSearch, updateSearch };
}
