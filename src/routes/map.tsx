import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ReachPointMap } from "@/components/ReachPointMap";
import {
  NEEDS,
  RESOURCES,
  TRAVEL_MODES,
  categoryMeta,
  hoursSummary,
  reachableMiles,
  scoreResources,
  type Match,
  type NeedCategory,
  type TravelMode,
} from "@/lib/reachpoint";
import { findResources } from "@/lib/reachpoint-live.functions";
import { saveResources, usePlan, useSearch } from "@/lib/reachpoint-store";

const TIME_OPTIONS = [15, 30, 45];

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "ReachPoint Map — Resources Within Reach" },
      {
        name: "description",
        content:
          "See the patient's real reachable area on a map, with ReachPoint Match scores for every nearby food, housing and benefits resource.",
      },
      { property: "og:title", content: "ReachPoint Map — Resources Within Reach" },
      {
        property: "og:description",
        content: "Pins ranked by travel time, open hours, walk-in policy and eligibility.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapScreen,
});

function MapScreen() {
  const { search, ready, update } = useSearch();
  const { plan, toggle } = usePlan();
  const navigate = useNavigate();
  const [now, setNow] = useState<Date | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const find = useServerFn(findResources);

  useEffect(() => setNow(new Date()), []);
  useEffect(() => {
    if (ready && !search) navigate({ to: "/" });
  }, [ready, search, navigate]);

  const needsKey = search ? [...search.needs].sort().join(",") : "";
  const live = useQuery({
    enabled: Boolean(search),
    queryKey: ["reachpoint-resources", search?.location.lat, search?.location.lng, needsKey],
    staleTime: 5 * 60 * 1000,
    queryFn: () =>
      find({
        data: {
          lat: search!.location.lat,
          lng: search!.location.lng,
          needs: search!.needs.length ? search!.needs : (["food"] as NeedCategory[]),
          radiusMiles: 10,
        },
      }),
  });

  const resources = useMemo(() => live.data ?? [], [live.data]);

  useEffect(() => {
    if (live.data) saveResources(live.data);
  }, [live.data]);

  const matches = useMemo<Match[]>(
    () => (search && now ? scoreResources(search, now, resources) : []),
    [search, now, resources],
  );

  if (!search || !now) {
    return (
      <main className="grid min-h-screen place-items-center text-muted-foreground">
        Loading resources…
      </main>
    );
  }

  const reach = reachableMiles(search.maxMinutes, search.mode);
  const within = matches.filter((m) => m.minutes <= search.maxMinutes);
  const beyond = matches.filter((m) => m.minutes > search.maxMinutes);
  const selectedMatch = matches.find((m) => m.resource.id === selected) ?? null;

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-3">
          <Link to="/" className="font-display text-lg font-semibold text-primary">
            ◎ ReachPoint
          </Link>
          <div className="min-w-0 flex-1 text-sm text-muted-foreground">
            <span className="truncate font-medium text-foreground">{search.location.address}</span>
            <span className="mx-2">·</span>
            {search.mode === "walking" ? "walking" : search.mode === "transit" ? "bus" : "driving"} ≤{" "}
            {search.maxMinutes} min
          </div>
          <Link
            to="/"
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            Edit search
          </Link>
          <Link
            to="/plan"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Patient plan ({plan.length})
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-5 lg:grid-cols-[1.15fr_1fr]">
        <div className="h-[380px] lg:sticky lg:top-[76px] lg:h-[calc(100vh-100px)]">
          <ReachPointMap
            center={search.location}
            matches={matches}
            reachMiles={reach}
            selectedId={selected}
            planIds={plan}
            onSelect={setSelected}
          />
        </div>

        <div className="space-y-3">
          <section className="rp-card space-y-4 p-4">
            <div>
              <p className="text-sm font-semibold">Add or change what they need</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {NEEDS.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      const has = search.needs.includes(n.id);
                      const next = has
                        ? search.needs.filter((x) => x !== n.id)
                        : [...search.needs, n.id];
                      update({ needs: next.length ? next : [n.id] });
                    }}
                    className={`rp-chip ${search.needs.includes(n.id) ? "rp-chip-on" : ""}`}
                  >
                    <span aria-hidden>{n.icon}</span>
                    {n.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold">How they travel</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {TRAVEL_MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => update({ mode: m.id as TravelMode })}
                      className={`rp-chip ${search.mode === m.id ? "rp-chip-on" : ""}`}
                    >
                      <span aria-hidden>{m.icon}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold">Travel limit</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {TIME_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => update({ maxMinutes: t })}
                      className={`rp-chip ${search.maxMinutes === t ? "rp-chip-on" : ""}`}
                    >
                      {t} min
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="flex items-baseline justify-between">
            <h1 className="text-2xl font-semibold">
              {live.isPending ? "Finding resources…" : `${within.length} matches within reach`}
            </h1>
            <span className="text-sm text-muted-foreground">ranked by ReachPoint Match</span>
          </div>

          {live.isError && (
            <p className="rp-card p-4 text-sm text-destructive">
              We couldn't load nearby resources just now. Please try again in a moment.
            </p>
          )}


          {within.map((m) => (
            <ResultCard
              key={m.resource.id}
              match={m}
              inPlan={plan.includes(m.resource.id)}
              expanded={selected === m.resource.id}
              onExpand={() => setSelected(selected === m.resource.id ? null : m.resource.id)}
              onToggle={() => toggle(m.resource.id)}
            />
          ))}

          {beyond.length > 0 && (
            <details className="rp-card p-4">
              <summary className="cursor-pointer text-sm font-semibold">
                {beyond.length} more just outside the reachable area
              </summary>
              <div className="mt-3 space-y-3">
                {beyond.map((m) => (
                  <ResultCard
                    key={m.resource.id}
                    match={m}
                    inPlan={plan.includes(m.resource.id)}
                    expanded={selected === m.resource.id}
                    onExpand={() => setSelected(selected === m.resource.id ? null : m.resource.id)}
                    onToggle={() => toggle(m.resource.id)}
                  />
                ))}
              </div>
            </details>
          )}

          {!live.isPending && matches.length === 0 && (
            <p className="rp-card p-6 text-sm text-muted-foreground">
              No resources found nearby for those needs. Try selecting more categories.
            </p>
          )}
        </div>
      </div>

      {selectedMatch && (
        <div className="sr-only">Selected: {selectedMatch.resource.name}</div>
      )}
    </main>
  );
}

function ResultCard({
  match,
  inPlan,
  expanded,
  onExpand,
  onToggle,
}: {
  match: Match;
  inPlan: boolean;
  expanded: boolean;
  onExpand: () => void;
  onToggle: () => void;
}) {
  const r = match.resource;
  const meta = categoryMeta(r.category);
  const tone =
    match.score >= 85 ? "bg-success text-success-foreground" : match.score >= 65 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground";

  return (
    <article className={`rp-card overflow-hidden ${expanded ? "ring-2 ring-ring/40" : ""}`}>
      <button onClick={onExpand} className="w-full p-4 text-left">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-lg">
            {meta.icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold">{r.name}</h2>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${tone}`}>
                {match.score}% match
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{r.subtitle}</p>
            <p className="mt-1 text-sm font-medium">
              {match.travel} · {match.miles.toFixed(1)} mi
              <span className={match.status.open ? "text-success" : "text-muted-foreground"}>
                {" "}
                · {match.status.open ? "🟢" : "⚪"} {match.status.label}
              </span>
            </p>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-border px-4 pt-4 pb-4">
          <p className="text-sm text-muted-foreground">{r.description}</p>
          <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
            {match.signals.map((s) => (
              <li key={s.label} className="flex items-start gap-2">
                <span className={s.ok ? "text-success" : "text-muted-foreground"}>
                  {s.ok ? "✓" : "•"}
                </span>
                <span className={s.ok ? "" : "text-muted-foreground"}>{s.label}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-xl bg-muted p-3 text-sm">
            <p className="font-semibold">What to bring</p>
            <ul className="mt-1 list-disc pl-5 text-muted-foreground">
              {r.bring.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>📍 {r.address}</p>
            <p>☎ {r.phone}</p>
            <p>🕒 {hoursSummary(r) || "Hours not published — call to confirm"}</p>
            {r.website && (
              <p>
                🔗{" "}
                <a
                  href={r.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-2 hover:underline"
                >
                  Website
                </a>
              </p>
            )}
            <p className="text-xs">Last verified {r.lastVerified}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border bg-surface px-4 py-2.5">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(r.address)}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-primary underline-offset-2 hover:underline"
        >
          Directions
        </a>
        <button
          onClick={onToggle}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
            inPlan
              ? "bg-secondary text-secondary-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {inPlan ? "✓ In plan" : "+ Add to patient plan"}
        </button>
      </div>
    </article>
  );
}

export const ALL_IDS = RESOURCES.map((r) => r.id);
