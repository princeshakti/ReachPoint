import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  RESOURCES,
  TRAVEL_MODES,
  buildRoute,
  categoryMeta,
  formatMinutes,
  openStatus,
  travelLabel,
  travelMinutes,
  distanceMiles,
  type Resource,
  type TravelMode,
} from "@/lib/halo";
import { usePlan, useResources, useSearch } from "@/lib/halo-store";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Patient Plan — Halo" },
      {
        name: "description",
        content:
          "Build, reorder and print a patient-friendly community resource handout with hours, what to bring, and a suggested route.",
      },
      { property: "og:title", content: "Patient Plan — Halo" },
      {
        property: "og:description",
        content: "A one-page handout a patient can actually take home and use.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlanScreen,
});

function PlanScreen() {
  const { plan, remove, move, clear, ready } = usePlan();
  const { search, ready: searchReady, update } = useSearch();
  const { resources: liveResources } = useResources();
  const navigate = useNavigate();
  const [now, setNow] = useState<Date | null>(null);
  const [showRoute, setShowRoute] = useState(false);

  useEffect(() => setNow(new Date()), []);
  useEffect(() => {
    if (searchReady && !search) navigate({ to: "/" });
  }, [searchReady, search, navigate]);

  const resources = useMemo(
    () => plan.map((id) => RESOURCES.find((r) => r.id === id)).filter(Boolean) as Resource[],
    [plan],
  );

  if (!search || !now || !ready) {
    return <main className="grid min-h-screen place-items-center text-muted-foreground">Loading…</main>;
  }

  const route = showRoute ? buildRoute(search.location, resources, search.mode) : null;
  const today = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="min-h-screen">
      <header className="no-print sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 px-5 py-3">
          <Link to="/" className="font-display text-lg font-semibold text-primary">
            ◎ Halo
          </Link>
          <div className="flex-1 text-sm text-muted-foreground">
            Selected resources — {resources.length}
          </div>
          <Link to="/map" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
            Back to map
          </Link>
        </div>
      </header>

      <div className="print-page mx-auto max-w-4xl px-5 py-8">
        {resources.length === 0 ? (
          <div className="halo-card p-8 text-center">
            <p className="text-muted-foreground">
              No resources selected yet. Add a few from the map.
            </p>
            <Link
              to="/map"
              className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Go to map
            </Link>
          </div>
        ) : (
          <>
            <div className="no-print mb-6 space-y-3">
              {resources.map((r, i) => (
                <div key={r.id} className="halo-card flex items-center gap-3 p-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-sm font-bold">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.subtitle}</p>
                  </div>
                  <button
                    onClick={() => move(r.id, -1)}
                    className="rounded-md border border-border px-2 py-1 text-xs"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(r.id, 1)}
                    className="rounded-md border border-border px-2 py-1 text-xs"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    className="rounded-md border border-border px-2 py-1 text-xs text-destructive"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => window.print()}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Print handout
                </button>
                <button
                  onClick={() => setShowRoute((v) => !v)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
                >
                  {showRoute ? "Hide Halo Route" : "Create Halo Route"}
                </button>
                <a
                  href={`sms:?&body=${encodeURIComponent(smsBody(resources, search.location.address))}`}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
                >
                  Text to patient
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent("Your community resources")}&body=${encodeURIComponent(smsBody(resources, search.location.address))}`}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
                >
                  Email
                </a>
                <button
                  onClick={clear}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-destructive hover:bg-muted"
                >
                  Clear
                </button>
              </div>
            </div>

            {route && (
              <section className="halo-card mb-6 p-5">
                <h2 className="text-xl font-semibold">Your Resource Route</h2>
                <ol className="mt-4 space-y-1">
                  <li className="text-sm font-semibold">🏠 Home — {search.location.address}</li>
                  {route.legs.map((leg, i) => (
                    <li key={leg.resource.id}>
                      <p className="py-1 pl-3 text-xs text-muted-foreground">↓ {leg.travel}</p>
                      <p className="text-sm font-semibold">
                        {i + 1}. {categoryMeta(leg.resource.category).icon} {leg.resource.name}
                      </p>
                      <p className="pl-5 text-xs text-muted-foreground">
                        {leg.resource.subtitle} · {openStatus(leg.resource, now).label}
                      </p>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 text-sm font-medium">
                  Total trip: approximately {formatMinutes(route.totalMinutes)} (includes ~25 min at
                  each stop)
                </p>
              </section>
            )}

            <section className="halo-card p-6 sm:p-8">
              <header className="border-b border-border pb-4">
                <h1 className="text-2xl font-semibold">Your Community Resources</h1>
                <p className="text-sm text-muted-foreground">
                  Prepared for you by your care team · {today}
                </p>
              </header>

              <div className="divide-y divide-border">
                {resources.map((r) => {
                  const miles = distanceMiles(search.location, r);
                  const minutes = travelMinutes(miles, search.mode);
                  const status = openStatus(r, now);
                  return (
                    <article key={r.id} className="py-5">
                      <p className="text-sm font-semibold text-primary">
                        {categoryMeta(r.category).icon} {categoryMeta(r.category).label}
                      </p>
                      <h3 className="text-lg font-semibold">{r.name}</h3>
                      <p className="text-sm">
                        {miles.toFixed(1)} mi • {travelLabel(minutes, search.mode, r)}
                      </p>
                      <p className="text-sm">Today: {status.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {r.walkIns
                          ? "You can walk in — appointment not required."
                          : "Call ahead — an appointment is required."}
                      </p>
                      <p className="mt-2 text-sm font-semibold">Bring:</p>
                      <ul className="text-sm text-muted-foreground">
                        {r.bring.map((b) => (
                          <li key={b}>☐ {b}</li>
                        ))}
                      </ul>
                      <p className="mt-2 text-sm">☎ {r.phone}</p>
                      <p className="text-sm">📍 {r.address}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Last verified: {r.lastVerified}
                      </p>
                    </article>
                  );
                })}
              </div>

              <p className="pt-4 text-xs text-muted-foreground">
                Hours can change. Please call before you go.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function smsBody(resources: Resource[], address: string) {
  return [
    "Your community resources (from your care team):",
    ...resources.map((r, i) => `${i + 1}. ${r.name} — ${r.address} — ${r.phone}`),
    `Near: ${address}`,
  ].join("\n");
}
