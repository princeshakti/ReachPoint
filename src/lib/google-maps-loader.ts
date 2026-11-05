import { getMapsBrowserKey } from "@/server/maps.functions";

type MapsApi = typeof google.maps;

export type MapsLoadFailure = "not_configured" | "network";

export class MapsLoadError extends Error {
  readonly reason: MapsLoadFailure;

  constructor(reason: MapsLoadFailure) {
    super(`Google Maps failed to load: ${reason}`);
    this.name = "MapsLoadError";
    this.reason = reason;
  }
}

const CALLBACK_NAME = "__reachpointMapsReady";

let pending: Promise<MapsApi> | null = null;
let authFailed = false;
const authFailureListeners = new Set<() => void>();

/**
 * Google calls `window.gm_authFailure` when it rejects the key: wrong API
 * enabled, billing off, or a referrer restriction that excludes this page.
 */
export function onMapsAuthFailure(listener: () => void): () => void {
  if (authFailed) listener();
  authFailureListeners.add(listener);
  return () => {
    authFailureListeners.delete(listener);
  };
}

function injectScript(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const globals = window as unknown as Record<string, unknown>;
    globals["gm_authFailure"] = () => {
      authFailed = true;
      authFailureListeners.forEach((listener) => listener());
    };
    globals[CALLBACK_NAME] = () => resolve();

    const script = document.createElement("script");
    const params = new URLSearchParams({ key, loading: "async", callback: CALLBACK_NAME });
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => reject(new MapsLoadError("network"));
    document.head.appendChild(script);
  });
}

async function loadMaps(): Promise<MapsApi> {
  const alreadyLoaded = typeof google !== "undefined" && Boolean(google.maps?.importLibrary);
  if (!alreadyLoaded) {
    const { key } = await getMapsBrowserKey();
    if (!key) throw new MapsLoadError("not_configured");
    await injectScript(key);
  }
  await Promise.all([
    google.maps.importLibrary("core"),
    google.maps.importLibrary("maps"),
    google.maps.importLibrary("marker"),
  ]);
  return google.maps;
}

/** Load the Google Maps JavaScript API once and share it. The key comes from the server. */
export function loadGoogleMaps(): Promise<MapsApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser."));
  }
  pending ??= loadMaps().catch((error: unknown) => {
    pending = null;
    throw error;
  });
  return pending;
}
