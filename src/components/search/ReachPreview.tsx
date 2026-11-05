import { Search } from "lucide-react";
import { NEEDS } from "@/lib/needs";
import { modeMeta, reachableMiles, REFERENCE_RADIUS_MILES } from "@/lib/travel";
import type { NeedId, TravelMode } from "@/lib/types";
import { ReachDiagram } from "./ReachDiagram";

interface ReachPreviewProps {
  mode: TravelMode;
  maxMinutes: number;
  address: string;
  needs: readonly NeedId[];
  busy: boolean;
  submitLabel: string;
}

export function ReachPreview({ mode, maxMinutes, address, needs, busy, submitLabel }: ReachPreviewProps) {
  const miles = reachableMiles(maxMinutes, mode);
  const { label, phrase } = modeMeta(mode);
  const reachText = `${miles.toFixed(1)} ${miles === 1 ? "mile" : "miles"}`;
  const needLabels = NEEDS.filter((need) => needs.includes(need.id)).map((need) => need.label);
  const beyondReference = miles >= REFERENCE_RADIUS_MILES;

  return (
    <div className="rounded-panel border border-line bg-surface p-5">
      <ReachDiagram
        reachMiles={miles}
        description={`In ${maxMinutes} minutes ${phrase} the patient can get about ${reachText}. A ${REFERENCE_RADIUS_MILES}-mile circle is drawn for comparison.`}
      />

      <ul className="mt-4 space-y-1.5 text-sm text-ink-soft">
        <li className="flex items-center gap-2.5">
          <span className="size-3 shrink-0 rounded-full border-2 border-reach bg-reach/20" aria-hidden="true" />
          Can reach {phrase} in {maxMinutes} min: about {reachText}
        </li>
        <li className="flex items-center gap-2.5">
          <span className="size-3 shrink-0 rounded-full border border-dashed border-ink-soft" aria-hidden="true" />A
          typical {REFERENCE_RADIUS_MILES}-mile search circle
        </li>
      </ul>

      <p className="mt-3 text-sm text-ink">
        {beyondReference
          ? `A ${REFERENCE_RADIUS_MILES}-mile search would miss places this patient can reach.`
          : `A ${REFERENCE_RADIUS_MILES}-mile search would list places this patient can't get to in time.`}
      </p>

      <dl className="mt-5 space-y-3 border-t border-line pt-4 text-sm">
        <div>
          <dt className="font-bold">Address</dt>
          <dd className={address ? "break-words text-ink-soft" : "text-ink-soft"}>{address || "Not entered yet"}</dd>
        </div>
        <div>
          <dt className="font-bold">Needs</dt>
          <dd className={needLabels.length ? "text-ink-soft" : "font-bold text-amber-ink"}>
            {needLabels.length ? needLabels.join(", ") : "Choose at least one"}
          </dd>
        </div>
        <div>
          <dt className="font-bold">Getting there</dt>
          <dd className="text-ink-soft">
            {label}, up to {maxMinutes} min
          </dd>
        </div>
      </dl>

      <button
        type="submit"
        disabled={busy}
        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-reach text-base font-bold text-white transition-colors hover:bg-reach-deep disabled:opacity-70"
      >
        <Search className="size-5" aria-hidden="true" />
        {submitLabel}
      </button>
    </div>
  );
}
