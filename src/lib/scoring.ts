import { openStatus, type OpenStatus } from "./hours";
import { distanceMiles, travelLabel, travelMinutes } from "./travel";
import type { Resource, SearchCriteria } from "./types";

export interface Match {
  resource: Resource;
  miles: number;
  minutes: number;
  /** 5–99. Blends how much of the travel budget is left with whether the place is open. */
  score: number;
  status: OpenStatus;
  withinReach: boolean;
  travel: string;
  /** Reminders for the phone call, based on what the care team flagged. */
  callNotes: string[];
}

const SCORE_FLOOR = 5;
const SCORE_CEILING = 99;

function openFit(status: OpenStatus): number {
  if (status.state === "open") return status.closingSoon ? 0.5 : 1;
  if (status.state === "unknown") return 0.4;
  return 0;
}

export function callNotesFor(criteria: Pick<SearchCriteria, "noId" | "spanish">): string[] {
  const notes: string[] = [];
  if (criteria.noId) notes.push("Patient has no ID. Ask if they can still be helped.");
  if (criteria.spanish) notes.push("Patient prefers Spanish. Ask about Spanish-speaking staff.");
  return notes;
}

/** Rank resources for a patient: reachable and open first, nearest and most feasible at the top. */
export function scoreResources(criteria: SearchCriteria, resources: readonly Resource[], now: Date): Match[] {
  const callNotes = callNotesFor(criteria);

  return resources
    .map((resource): Match => {
      const miles = distanceMiles(criteria.location, resource);
      const minutes = travelMinutes(miles, criteria.mode);
      const status = openStatus(resource, now);
      const withinReach = minutes <= criteria.maxMinutes;

      const timeFit = Math.max(0, 1 - minutes / criteria.maxMinutes);
      const raw = 100 * (0.65 * timeFit + 0.35 * openFit(status));
      const score = Math.max(SCORE_FLOOR, Math.min(SCORE_CEILING, Math.round(raw)));

      return {
        resource,
        miles,
        minutes,
        score,
        status,
        withinReach,
        travel: travelLabel(minutes, criteria.mode),
        callNotes,
      };
    })
    .sort((a, b) => Number(b.withinReach) - Number(a.withinReach) || b.score - a.score || a.minutes - b.minutes);
}
