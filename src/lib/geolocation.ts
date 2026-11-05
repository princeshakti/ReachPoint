import type { LatLng } from "./types";

export type PositionResult = { ok: true; position: LatLng } | { ok: false; message: string };

const MESSAGES = {
  unsupported: "This browser can't share a location. Type the address instead.",
  insecure:
    "Browsers only share location on secure pages (https or localhost). Open ReachPoint that way, or type the address.",
  denied: "Location is blocked for this site. Allow it in your browser's site settings, or type the address.",
  timeout: "Finding your location took too long. Try again, or type the address.",
  unavailable: "Couldn't work out your location. Type the address instead.",
} as const;

/** Ask the browser where the device is, with a message for each way it can fail. */
export function requestPosition(): Promise<PositionResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve({ ok: false, message: MESSAGES.unsupported });
  }
  if (!window.isSecureContext) {
    return Promise.resolve({ ok: false, message: MESSAGES.insecure });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (result) => resolve({ ok: true, position: { lat: result.coords.latitude, lng: result.coords.longitude } }),
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? MESSAGES.denied
            : error.code === error.TIMEOUT
              ? MESSAGES.timeout
              : MESSAGES.unavailable;
        resolve({ ok: false, message });
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  });
}
