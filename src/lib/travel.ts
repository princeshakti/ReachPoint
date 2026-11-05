import type { LatLng, TravelMode } from "./types";

export interface TravelModeMeta {
  id: TravelMode;
  label: string;
  /** Reads naturally after "Travelling": "on foot", "by bus". */
  phrase: string;
}

export const TRAVEL_MODES: readonly TravelModeMeta[] = [
  { id: "walking", label: "Walking", phrase: "on foot" },
  { id: "transit", label: "Public transit", phrase: "by bus" },
  { id: "driving", label: "Driving", phrase: "by car" },
];

export const TIME_OPTIONS = [15, 30, 45] as const;

/**
 * Rough door-to-door model: average speed, a fixed overhead (waiting for the
 * bus, parking) and a detour factor because streets are never a straight line.
 * These are estimates, not routing results.
 */
const PROFILE: Record<TravelMode, { mph: number; overheadMinutes: number; detour: number }> = {
  walking: { mph: 3, overheadMinutes: 0, detour: 1.25 },
  transit: { mph: 11, overheadMinutes: 9, detour: 1.4 },
  driving: { mph: 24, overheadMinutes: 4, detour: 1.3 },
};

/** The circle most directory searches use, shown for comparison. */
export const REFERENCE_RADIUS_MILES = 3;

const EARTH_RADIUS_MILES = 3958.8;

export function distanceMiles(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

export function travelMinutes(miles: number, mode: TravelMode): number {
  const { mph, overheadMinutes, detour } = PROFILE[mode];
  return Math.max(1, Math.round((miles * detour * 60) / mph + overheadMinutes));
}

/** How far, in straight-line miles, someone can get within `maxMinutes`. */
export function reachableMiles(maxMinutes: number, mode: TravelMode): number {
  const { mph, overheadMinutes, detour } = PROFILE[mode];
  return Math.max(0.2, ((maxMinutes - overheadMinutes) * mph) / 60 / detour);
}

/**
 * How wide to search Google Places. Wider than the reachable area so that
 * places just outside it still show up, but narrow enough that nearby places
 * are not crowded out of Google's result limit.
 */
export function searchRadiusMiles(maxMinutes: number, mode: TravelMode): number {
  const wide = reachableMiles(maxMinutes, mode) * 1.6;
  return Math.min(25, Math.max(2, Math.round(wide * 2) / 2));
}

export function travelLabel(minutes: number, mode: TravelMode): string {
  if (mode === "walking") return `${minutes} min walk`;
  if (mode === "driving") return `${minutes} min drive`;
  return `${minutes} min by bus`;
}

export function formatMiles(miles: number): string {
  return miles < 0.1 ? "under 0.1 mi" : `${miles.toFixed(1)} mi`;
}

export function modeMeta(mode: TravelMode): TravelModeMeta {
  return TRAVEL_MODES.find((m) => m.id === mode) ?? TRAVEL_MODES[0]!;
}
