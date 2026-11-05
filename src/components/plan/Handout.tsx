import { LogoMark } from "@/components/Logo";
import { hoursSummary } from "@/lib/hours";
import { needLabel } from "@/lib/needs";
import { distanceMiles, formatMiles, travelLabel, travelMinutes } from "@/lib/travel";
import type { PatientLocation, Resource, TravelMode } from "@/lib/types";

interface HandoutProps {
  plan: readonly Resource[];
  origin: PatientLocation;
  mode: TravelMode;
}

/** The page the patient takes home. Written for the patient, so it avoids clinical wording. */
export function Handout({ plan, origin, mode }: HandoutProps) {
  return (
    <section className="handout rounded-panel border border-line bg-surface p-6 sm:p-8" aria-label="Patient handout">
      <div className="flex items-center gap-3">
        <LogoMark className="size-9" />
        <div>
          <h2 className="text-2xl font-bold leading-tight">Your community resources</h2>
          <p className="text-sm text-ink-soft">Chosen for you by your care team · Near {origin.address}</p>
        </div>
      </div>

      <p className="mt-5 rounded-lg bg-amber-tint p-3 text-sm font-bold text-amber-ink">
        Please call before you go. Hours can change, and the place can tell you what to bring.
      </p>

      <ol className="mt-5 space-y-4">
        {plan.map((resource, index) => {
          const miles = distanceMiles(origin, resource);
          const hours = hoursSummary(resource);
          return (
            <li key={resource.id} className="handout-item rounded-tile border border-line p-4">
              <p className="text-lg font-bold">
                {index + 1}. {resource.name}
              </p>
              <p className="text-sm text-ink-soft">{needLabel(resource.need)}</p>
              <dl className="mt-3 grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[7rem_1fr]">
                <dt className="font-bold">Address</dt>
                <dd>{resource.address}</dd>
                {resource.phone && (
                  <>
                    <dt className="font-bold">Phone</dt>
                    <dd>{resource.phone}</dd>
                  </>
                )}
                <dt className="font-bold">Hours</dt>
                <dd>{hours ?? "Not listed. Please call."}</dd>
                <dt className="font-bold">Getting there</dt>
                <dd>
                  About {travelLabel(travelMinutes(miles, mode), mode)} ({formatMiles(miles)})
                </dd>
              </dl>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
