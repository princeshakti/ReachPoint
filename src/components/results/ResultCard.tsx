import { Check, ChevronDown, Clock, Globe, MapPin, Navigation, Phone, Plus } from "lucide-react";
import { NEED_ICONS } from "@/components/icons";
import { cn } from "@/lib/cn";
import { hoursSummary } from "@/lib/hours";
import { needLabel } from "@/lib/needs";
import type { Match } from "@/lib/scoring";
import { directionsUrl } from "@/lib/share";
import { formatMiles } from "@/lib/travel";
import { StatusBadge } from "./StatusBadge";

interface ResultCardProps {
  match: Match;
  inPlan: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onTogglePlan: () => void;
}

export function ResultCard({ match, inPlan, expanded, onToggleExpanded, onTogglePlan }: ResultCardProps) {
  const { resource, status } = match;
  const Icon = NEED_ICONS[resource.need];
  const hours = hoursSummary(resource);
  const panelId = `details-${resource.id}`;

  const scoreTone =
    match.score >= 75
      ? "bg-ok-tint text-ok"
      : match.score >= 50
        ? "bg-reach-tint text-reach-deep"
        : "bg-line/60 text-ink-soft";

  return (
    <article
      id={`result-${resource.id}`}
      className={cn(
        "overflow-hidden rounded-tile border bg-surface transition-colors",
        expanded ? "border-reach ring-1 ring-reach" : "border-line",
      )}
    >
      <button
        type="button"
        onClick={onToggleExpanded}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-reach-tint text-reach-deep">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-base font-bold leading-snug">{resource.name}</span>
            <span
              className={cn("rounded-full px-2 py-0.5 text-xs font-bold", scoreTone)}
              title="Match: how much of the travel limit is left, and whether the place is open now"
            >
              {match.score}% match
            </span>
          </span>
          <span className="block text-sm text-ink-soft">
            {needLabel(resource.need)} · {resource.kind}
          </span>
          <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-sm font-bold">
              <Clock className="size-4 text-ink-soft" aria-hidden="true" />
              About {match.travel} · {formatMiles(match.miles)}
            </span>
            <StatusBadge status={status} />
          </span>
        </span>
        <ChevronDown
          className={cn("mt-1 size-5 shrink-0 text-ink-soft transition-transform", expanded && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {expanded && (
        <div id={panelId} className="space-y-3 border-t border-line px-4 py-4 text-sm">
          <p className="flex gap-2.5">
            <MapPin className="mt-0.5 size-4 shrink-0 text-ink-soft" aria-hidden="true" />
            {resource.address}
          </p>
          {resource.phone && (
            <p className="flex gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0 text-ink-soft" aria-hidden="true" />
              <a
                href={`tel:${resource.phone}`}
                className="font-bold text-reach-deep underline-offset-2 hover:underline"
              >
                {resource.phone}
              </a>
            </p>
          )}
          <p className="flex gap-2.5">
            <Clock className="mt-0.5 size-4 shrink-0 text-ink-soft" aria-hidden="true" />
            {hours ?? "Hours not listed. Call to confirm."}
          </p>
          {resource.website && (
            <p className="flex gap-2.5">
              <Globe className="mt-0.5 size-4 shrink-0 text-ink-soft" aria-hidden="true" />
              <a
                href={resource.website}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-reach-deep underline-offset-2 hover:underline"
              >
                Website
              </a>
            </p>
          )}

          <div className="rounded-lg bg-amber-tint p-3 text-amber-ink">
            <p className="font-bold">Call to confirm before sending the patient</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              <li>Hours and whether walk-ins are welcome</li>
              <li>What to bring</li>
              {match.callNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-ink-soft">
            Listing from Google Maps, retrieved {resource.retrievedOn}. Travel time is an estimate.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-line bg-reach-wash px-4 py-2.5">
        <a
          href={directionsUrl(resource)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-reach-deep underline-offset-2 hover:underline"
        >
          <Navigation className="size-4" aria-hidden="true" />
          Directions
        </a>
        <button
          type="button"
          onClick={onTogglePlan}
          aria-pressed={inPlan}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-colors",
            inPlan ? "border border-reach bg-reach-tint text-reach-deep" : "bg-reach text-white hover:bg-reach-deep",
          )}
        >
          {inPlan ? <Check className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
          {inPlan ? "In patient plan" : "Add to patient plan"}
        </button>
      </div>
    </article>
  );
}
