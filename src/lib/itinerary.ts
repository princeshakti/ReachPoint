import { distanceMiles, travelLabel, travelMinutes } from "./travel";
import type { LatLng, Resource, TravelMode } from "./types";

export interface RouteLeg {
  resource: Resource;
  minutes: number;
  miles: number;
  travel: string;
}

export interface Itinerary {
  legs: RouteLeg[];
  /** Travel time plus an allowance for time spent at each stop. */
  totalMinutes: number;
}

export const MINUTES_PER_STOP = 25;

/** Visit the stops by always heading to the nearest one that is left. Good enough for a handful of stops. */
export function planItinerary(start: LatLng, stops: readonly Resource[], mode: TravelMode): Itinerary {
  const remaining = [...stops];
  const legs: RouteLeg[] = [];
  let current: LatLng = start;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestMiles = Infinity;
    remaining.forEach((stop, index) => {
      const miles = distanceMiles(current, stop);
      if (miles < nearestMiles) {
        nearestMiles = miles;
        nearestIndex = index;
      }
    });

    const [next] = remaining.splice(nearestIndex, 1);
    if (!next) break;
    const minutes = travelMinutes(nearestMiles, mode);
    legs.push({ resource: next, minutes, miles: nearestMiles, travel: travelLabel(minutes, mode) });
    current = next;
  }

  const travelTotal = legs.reduce((sum, leg) => sum + leg.minutes, 0);
  return { legs, totalMinutes: travelTotal + legs.length * MINUTES_PER_STOP };
}

export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;
}
