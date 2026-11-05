import { Navigation } from "lucide-react";
import { useMemo } from "react";
import { formatDuration, MINUTES_PER_STOP, planItinerary } from "@/lib/itinerary";
import { directionsUrl } from "@/lib/share";
import { formatMiles, modeMeta } from "@/lib/travel";
import type { PatientLocation, Resource, TravelMode } from "@/lib/types";

interface RoutePanelProps {
  origin: PatientLocation;
  plan: readonly Resource[];
  mode: TravelMode;
}

/** A suggested order for visiting every place in the plan, starting from the patient's address. */
export function RoutePanel({ origin, plan, mode }: RoutePanelProps) {
  const itinerary = useMemo(() => planItinerary(origin, plan, mode), [origin, plan, mode]);

  return (
    <section className="no-print rounded-panel border border-line bg-surface p-5" aria-label="Route builder">
      <h2 className="text-lg font-bold">Suggested route</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Nearest stop first, {modeMeta(mode).phrase}. About {formatDuration(itinerary.totalMinutes)} in total, allowing{" "}
        {MINUTES_PER_STOP} minutes at each stop. Times are estimates.
      </p>
      <ol className="mt-4 space-y-2">
        <li className="text-sm font-bold text-home">Start: {origin.address}</li>
        {itinerary.legs.map((leg, index) => (
          <li key={leg.resource.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-bold">
              {index + 1}. {leg.resource.name}
            </span>
            <span className="text-ink-soft">
              About {leg.travel} · {formatMiles(leg.miles)}
            </span>
            <a
              href={directionsUrl(leg.resource)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-bold text-reach-deep underline-offset-2 hover:underline"
            >
              <Navigation className="size-3.5" aria-hidden="true" />
              Directions
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
