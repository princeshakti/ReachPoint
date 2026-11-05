import { useSyncExternalStore } from "react";

/**
 * A tiny store backed by sessionStorage, so search details and the patient plan
 * survive navigation and refreshes but disappear when the tab closes. Nothing
 * about a patient is kept on the device after that.
 *
 * It works with `useSyncExternalStore`: the server (and the first client render)
 * see `fallback`, then the browser switches to the stored value without a
 * hydration mismatch.
 */
export interface SessionStore<T> {
  read: () => T;
  write: (value: T | null) => void;
  subscribe: (listener: () => void) => () => void;
  getServerSnapshot: () => T;
}

export function createSessionStore<T>(key: string, fallback: T): SessionStore<T> {
  const listeners = new Set<() => void>();
  let cachedRaw: string | null | undefined;
  let cachedValue: T = fallback;

  const read = (): T => {
    if (typeof window === "undefined") return fallback;
    let raw: string | null = null;
    try {
      raw = window.sessionStorage.getItem(key);
    } catch {
      return fallback;
    }
    // Return the same object while the stored text is unchanged. React compares snapshots by identity.
    if (raw === cachedRaw) return cachedValue;
    cachedRaw = raw;
    try {
      cachedValue = raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      cachedValue = fallback;
    }
    return cachedValue;
  };

  const write = (value: T | null) => {
    try {
      if (value === null) window.sessionStorage.removeItem(key);
      else window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can be blocked (private mode, policy). The app still works for this page view.
    }
    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return { read, write, subscribe, getServerSnapshot: () => fallback };
}

export function useSessionStore<T>(store: SessionStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.read, store.getServerSnapshot);
}
