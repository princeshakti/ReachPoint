import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ClipboardList, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { AppHeader, headerButton, headerButtonPrimary } from "@/components/AppHeader";
import { PageLoading } from "@/components/RouteStates";
import { ReachMap } from "@/components/results/ReachMap";
import { RefinePanel } from "@/components/results/RefinePanel";
import { ResultsList } from "@/components/results/ResultsList";
import { useHydrated } from "@/hooks/useHydrated";
import { useNow } from "@/hooks/useNow";
import { usePlan } from "@/hooks/usePlan";
import { useSearch } from "@/hooks/useSearch";
import { needLabel } from "@/lib/needs";
import { scoreResources } from "@/lib/scoring";
import { modeMeta, reachableMiles, searchRadiusMiles } from "@/lib/travel";
import { findResources } from "@/server/maps.functions";

export const Route = createFileRoute("/map")({
  component: ResultsPage,
});

function ResultsPage() {
  const hydrated = useHydrated();
  const { search } = useSearch();

  if (!hydrated) return <PageLoading />;
  if (!search) return <Navigate to="/" />;
  return <Results />;
}

function Results() {
  const { search: stored, updateSearch } = useSearch();
  const { plan, toggle } = usePlan();
  const now = useNow();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // The page only renders this component once a search exists.
  const search = stored!;
  const needsKey = [...search.needs].sort().join(",");
  const radius = searchRadiusMiles(search.maxMinutes, search.mode);

  const query = useQuery({
    queryKey: ["resources", search.location.lat, search.location.lng, needsKey, radius],
    queryFn: async () => {
      const result = await findResources({
        data: { lat: search.location.lat, lng: search.location.lng, needs: search.needs, radiusMiles: radius },
      });
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
    retry: 1,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });

  const matches = useMemo(
    () => (query.data && now ? scoreResources(search, query.data.resources, now) : []),
    [query.data, now, search],
  );
  const within = matches.filter((m) => m.withinReach).sort((a, b) => b.score - a.score);
  const beyond = matches.filter((m) => !m.withinReach).sort((a, b) => a.minutes - b.minutes);
  const planIds = useMemo(() => plan.map((r) => r.id), [plan]);

  const reachMiles = reachableMiles(search.maxMinutes, search.mode);
  const caption = `Shaded area: reachable ${modeMeta(search.mode).phrase} in ${search.maxMinutes} min`;

  return (
    <>
      <AppHeader sticky>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Link to="/" className={headerButton}>
            <Pencil className="size-4" aria-hidden="true" />
            Edit search
          </Link>
          <Link to="/plan" className={headerButtonPrimary}>
            <ClipboardList className="size-4" aria-hidden="true" />
            Patient plan ({plan.length})
          </Link>
        </div>
      </AppHeader>

      <main className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="order-2 space-y-5 lg:order-1">
          <div>
            <h1 className="text-2xl font-bold">
              {within.length > 0
                ? `${within.length} ${within.length === 1 ? "place" : "places"} within reach`
                : "Resources near the patient"}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              Near {search.location.address} · {search.needs.map(needLabel).join(", ")}
              {query.isFetching && " · Updating…"}
            </p>
          </div>

          <RefinePanel search={search} onChange={updateSearch} />

          <ResultsList
            within={within}
            beyond={beyond}
            loading={query.isPending || !now}
            errorMessage={query.isError ? query.error.message : null}
            onRetry={() => void query.refetch()}
            partial={query.data?.partial ?? false}
            selectedId={selectedId}
            onSelect={setSelectedId}
            planIds={planIds}
            onTogglePlan={toggle}
          />
        </div>

        <div className="order-1 h-80 lg:sticky lg:top-20 lg:order-2 lg:h-[calc(100vh-6.5rem)]">
          <ReachMap
            center={search.location}
            reachMiles={reachMiles}
            caption={caption}
            matches={matches}
            selectedId={selectedId}
            planIds={planIds}
            onSelect={setSelectedId}
          />
        </div>
      </main>
    </>
  );
}
