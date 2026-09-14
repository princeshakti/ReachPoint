import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { NEEDS, TRAVEL_MODES, geocode, type NeedCategory, type TravelMode } from "@/lib/halo";
import { saveSearch } from "@/lib/halo-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Halo — Reachable Community Resources for Patients" },
      {
        name: "description",
        content:
          "Halo helps care teams find food, shelter, EBT and utility help a patient can actually reach — ranked by travel time, hours and eligibility.",
      },
      { property: "og:title", content: "Halo — Reachable Community Resources for Patients" },
      {
        property: "og:description",
        content:
          "Search by address, need and how the patient travels. Build a printable resource plan in minutes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchScreen,
});

const TIME_OPTIONS = [15, 30, 45];

function SearchScreen() {
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [needs, setNeeds] = useState<NeedCategory[]>(["food"]);
  const [mode, setMode] = useState<TravelMode>("walking");
  const [maxMinutes, setMaxMinutes] = useState(15);
  const [noIdOnly, setNoIdOnly] = useState(false);
  const [spanish, setSpanish] = useState(false);
  const [error, setError] = useState("");

  const toggleNeed = (id: NeedCategory) =>
    setNeeds((n) => (n.includes(id) ? n.filter((x) => x !== id) : [...n, id]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setError("Enter the patient's address or cross streets.");
      return;
    }
    saveSearch({
      location: geocode(address),
      needs,
      mode,
      maxMinutes,
      language: spanish ? "Spanish" : undefined,
      noIdOnly,
    });
    navigate({ to: "/map" });
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-12">
      <header className="mb-10">
        <div className="flex items-center gap-2 text-primary">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-lg">
            ◎
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">Halo</span>
        </div>
        <h1 className="mt-6 text-4xl leading-tight font-semibold sm:text-5xl">
          Find help the patient can{" "}
          <span className="text-primary italic">actually reach</span>.
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Not a three-mile circle. Halo ranks food, shelter, EBT and utility resources by real
          travel time, today's hours, and whether they're walk-in friendly.
        </p>
      </header>

      <form onSubmit={submit} className="halo-card space-y-8 p-6 sm:p-8">
        <section>
          <label htmlFor="address" className="text-sm font-semibold">
            Find resources around
          </label>
          <input
            id="address"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setError("");
            }}
            placeholder="123 Main St, Norwalk, CA 90650"
            className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
          />
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          <p className="mt-2 text-xs text-muted-foreground">
            Cross streets are fine. Nothing is saved to a patient record.
          </p>
        </section>

        <section>
          <p className="text-sm font-semibold">What do they need?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {NEEDS.map((n) => (
              <button
                type="button"
                key={n.id}
                onClick={() => toggleNeed(n.id)}
                className={`halo-chip ${needs.includes(n.id) ? "halo-chip-on" : ""}`}
              >
                <span aria-hidden>{n.icon}</span>
                {n.label}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold">How can they travel?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {TRAVEL_MODES.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`halo-chip ${mode === m.id ? "halo-chip-on" : ""}`}
                >
                  <span aria-hidden>{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">How far can they reasonably go?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {TIME_OPTIONS.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setMaxMinutes(t)}
                  className={`halo-chip ${maxMinutes === t ? "halo-chip-on" : ""}`}
                >
                  {t} min
                </button>
              ))}
            </div>
          </div>
        </section>

        <section>
          <p className="text-sm font-semibold">Patient situation (optional)</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setNoIdOnly((v) => !v)}
              className={`halo-chip ${noIdOnly ? "halo-chip-on" : ""}`}
            >
              No ID available
            </button>
            <button
              type="button"
              onClick={() => setSpanish((v) => !v)}
              className={`halo-chip ${spanish ? "halo-chip-on" : ""}`}
            >
              Spanish preferred
            </button>
          </div>
        </section>

        <button
          type="submit"
          className="w-full rounded-xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground transition-transform hover:brightness-110 active:scale-[0.99]"
        >
          Find resources
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Demo directory for Norwalk, CA. Always confirm hours by phone before sending a patient.
      </p>
    </main>
  );
}
