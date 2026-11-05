import { ArrowDown, ArrowUp, Clock, Phone, Trash2 } from "lucide-react";
import { NEED_ICONS } from "@/components/icons";
import { needLabel } from "@/lib/needs";
import { formatMiles, travelLabel, travelMinutes, distanceMiles } from "@/lib/travel";
import type { PatientLocation, Resource, TravelMode } from "@/lib/types";

interface PlanEditorProps {
  plan: readonly Resource[];
  origin: PatientLocation;
  mode: TravelMode;
  onMove: (id: string, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
}

const iconButton =
  "grid size-9 place-items-center rounded-full border border-line-strong bg-surface text-ink-soft transition-colors hover:border-reach hover:text-reach-deep disabled:pointer-events-none disabled:opacity-40";

/** The places in the plan, in the order they will be shown on the handout. */
export function PlanEditor({ plan, origin, mode, onMove, onRemove }: PlanEditorProps) {
  return (
    <ol className="space-y-3">
      {plan.map((resource, index) => {
        const Icon = NEED_ICONS[resource.need];
        const miles = distanceMiles(origin, resource);
        const travel = travelLabel(travelMinutes(miles, mode), mode);
        return (
          <li key={resource.id} className="flex items-start gap-3 rounded-tile border border-line bg-surface p-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-reach text-sm font-bold text-white">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-bold leading-snug">
                <Icon className="size-4 shrink-0 text-reach-deep" aria-hidden="true" />
                {resource.name}
              </p>
              <p className="text-sm text-ink-soft">
                {needLabel(resource.need)} · {resource.address}
              </p>
              <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4 text-ink-soft" aria-hidden="true" />
                  About {travel} · {formatMiles(miles)}
                </span>
                {resource.phone && (
                  <a href={`tel:${resource.phone}`} className="inline-flex items-center gap-1.5 text-reach-deep">
                    <Phone className="size-4" aria-hidden="true" />
                    {resource.phone}
                  </a>
                )}
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                className={iconButton}
                disabled={index === 0}
                onClick={() => onMove(resource.id, -1)}
                aria-label={`Move ${resource.name} up`}
              >
                <ArrowUp className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={iconButton}
                disabled={index === plan.length - 1}
                onClick={() => onMove(resource.id, 1)}
                aria-label={`Move ${resource.name} down`}
              >
                <ArrowDown className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={iconButton}
                onClick={() => onRemove(resource.id)}
                aria-label={`Remove ${resource.name} from the plan`}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
