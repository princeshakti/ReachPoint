import { Loader2, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import type { Match } from "@/lib/scoring";
import type { Resource } from "@/lib/types";
import { ResultCard } from "./ResultCard";

interface ResultsListProps {
  within: readonly Match[];
  beyond: readonly Match[];
  loading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  /** Some searches failed, so the list may be missing places. */
  partial: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  planIds: readonly string[];
  onTogglePlan: (resource: Resource) => void;
}

export function ResultsList({
  within,
  beyond,
  loading,
  errorMessage,
  onRetry,
  partial,
  selectedId,
  onSelect,
  planIds,
  onTogglePlan,
}: ResultsListProps) {
  // When a pin on the map is clicked, scroll its card into view.
  useEffect(() => {
    if (!selectedId) return;
    document.getElementById(`result-${selectedId}`)?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  if (errorMessage) {
    return (
      <div role="alert" className="rounded-tile border border-danger/40 bg-danger-tint p-4 text-sm">
        <p className="flex items-start gap-2 font-bold text-danger">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {errorMessage}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex h-9 items-center rounded-full border border-danger/50 bg-surface px-4 font-bold text-danger hover:bg-danger-tint"
        >
          Try again
        </button>
      </div>
    );
  }

  if (loading && within.length === 0 && beyond.length === 0) {
    return (
      <p className="flex items-center gap-2 py-8 text-sm font-bold text-ink-soft">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Searching Google Maps…
      </p>
    );
  }

  const renderCard = (match: Match) => (
    <ResultCard
      key={match.resource.id}
      match={match}
      inPlan={planIds.includes(match.resource.id)}
      expanded={selectedId === match.resource.id}
      onToggleExpanded={() => onSelect(selectedId === match.resource.id ? null : match.resource.id)}
      onTogglePlan={() => onTogglePlan(match.resource)}
    />
  );

  return (
    <div className="space-y-3">
      {partial && (
        <p className="rounded-tile bg-amber-tint p-3 text-sm font-bold text-amber-ink">
          Some searches didn't finish, so this list may be missing places. Try again in a moment.
        </p>
      )}

      {within.length === 0 && (
        <p className="rounded-tile border border-line bg-surface p-5 text-sm text-ink-soft">
          Nothing found within the travel limit. Add more needs, allow a longer trip, or try another way of travelling.
        </p>
      )}

      {within.map(renderCard)}

      {beyond.length > 0 && (
        <details className="rounded-tile border border-line bg-surface p-4">
          <summary className="cursor-pointer text-sm font-bold">
            {beyond.length} more just outside the travel limit
          </summary>
          <div className="mt-3 space-y-3">{beyond.map(renderCard)}</div>
        </details>
      )}
    </div>
  );
}
