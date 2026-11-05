import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ModePicker, TimePicker } from "@/components/TravelControls";
import { NeedPicker } from "@/components/NeedPicker";
import { clearPlan } from "@/hooks/usePlan";
import { readSearch, useSearch } from "@/hooks/useSearch";
import { useHydrated } from "@/hooks/useHydrated";
import { requestPosition } from "@/lib/geolocation";
import { modeMeta, reachableMiles } from "@/lib/travel";
import type { NeedId, PatientLocation, TravelMode } from "@/lib/types";
import { geocodeAddress, reverseGeocode } from "@/server/maps.functions";
import { AddressField } from "./AddressField";
import { FlagOptions } from "./FlagOptions";
import { ReachPreview } from "./ReachPreview";

type Status = "idle" | "locating" | "searching";

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="border-b border-line p-5 last:border-b-0 sm:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function SearchForm() {
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const { search, saveSearch } = useSearch();
  const addressRef = useRef<HTMLInputElement | null>(null);
  const restored = useRef(false);

  const [address, setAddress] = useState("");
  const [resolved, setResolved] = useState<PatientLocation | null>(null);
  const [usingDeviceLocation, setUsingDeviceLocation] = useState(false);
  const [needs, setNeeds] = useState<NeedId[]>(["food"]);
  const [mode, setMode] = useState<TravelMode>("walking");
  const [maxMinutes, setMaxMinutes] = useState(15);
  const [noId, setNoId] = useState(false);
  const [spanish, setSpanish] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [addressError, setAddressError] = useState<string | null>(null);
  const [needsError, setNeedsError] = useState(false);

  // Coming back with "Edit search": fill the form with what was entered before.
  useEffect(() => {
    if (!hydrated || restored.current || !search) return;
    restored.current = true;
    setAddress(search.location.address);
    setResolved(search.location);
    setNeeds(search.needs);
    setMode(search.mode);
    setMaxMinutes(search.maxMinutes);
    setNoId(search.noId);
    setSpanish(search.spanish);
  }, [hydrated, search]);

  const busy = status !== "idle";

  function handleAddressChange(value: string) {
    setAddress(value);
    setResolved(null);
    setUsingDeviceLocation(false);
    setAddressError(null);
  }

  function handleToggleNeed(id: NeedId) {
    setNeedsError(false);
    setNeeds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function handleUseLocation() {
    setAddressError(null);
    setStatus("locating");

    const position = await requestPosition();
    if (!position.ok) {
      setAddressError(position.message);
      setStatus("idle");
      return;
    }

    // The coordinates are enough to search. The street address is only for display,
    // so a failed address lookup must not stop the search.
    let location: PatientLocation = {
      ...position.position,
      address: `Current location (${position.position.lat.toFixed(4)}, ${position.position.lng.toFixed(4)})`,
    };
    try {
      const lookup = await reverseGeocode({ data: position.position });
      if (lookup.ok) location = { ...position.position, address: lookup.data.address };
    } catch {
      // Keep the coordinate label.
    }

    setAddress(location.address);
    setResolved(location);
    setUsingDeviceLocation(true);
    setStatus("idle");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const typed = address.trim();

    if (typed.length < 3) {
      setAddressError("Enter the patient's street address, city or ZIP code, or use this device's location.");
      addressRef.current?.focus();
      return;
    }
    if (needs.length === 0) {
      setNeedsError(true);
      return;
    }

    setStatus("searching");
    setAddressError(null);

    let location = resolved;
    if (!location) {
      try {
        const lookup = await geocodeAddress({ data: { address: typed } });
        if (!lookup.ok) {
          setAddressError(lookup.message);
          setStatus("idle");
          addressRef.current?.focus();
          return;
        }
        location = lookup.data;
      } catch {
        setAddressError("Address lookup didn't work. Check the connection and try again.");
        setStatus("idle");
        return;
      }
    }

    // A different address means a different patient, so start a fresh plan.
    const previous = readSearch();
    if (previous && previous.location.address !== location.address) clearPlan();

    saveSearch({ location, needs, mode, maxMinutes, noId, spanish });
    await navigate({ to: "/map" });
  }

  const miles = reachableMiles(maxMinutes, mode);

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:gap-8"
    >
      <div className="rounded-panel border border-line bg-surface">
        <Section title="Where does the patient live?">
          <AddressField
            value={address}
            onChange={handleAddressChange}
            onUseLocation={handleUseLocation}
            inputRef={addressRef}
            locating={status === "locating"}
            disabled={busy}
            error={addressError}
            usingCurrentLocation={usingDeviceLocation}
          />
        </Section>

        <Section
          title="What do they need?"
          hint="Pick everything that applies. You can change this on the next screen."
        >
          <NeedPicker selected={needs} onToggle={handleToggleNeed} />
          {needsError && (
            <p role="alert" className="mt-3 text-sm font-bold text-danger">
              Choose at least one need.
            </p>
          )}
        </Section>

        <Section
          title="How do they get around?"
          hint={`${maxMinutes} minutes ${modeMeta(mode).phrase} is about ${miles.toFixed(1)} miles.`}
        >
          <div className="grid gap-4 min-[640px]:grid-cols-[3fr_2fr]">
            <ModePicker value={mode} onChange={setMode} legend="Travel mode" hideLegend />
            <TimePicker value={maxMinutes} onChange={setMaxMinutes} legend="Longest trip" />
          </div>
        </Section>

        <Section title="Anything to flag?" hint="Optional.">
          <FlagOptions
            noId={noId}
            spanish={spanish}
            onChange={(flag, value) => (flag === "noId" ? setNoId(value) : setSpanish(value))}
          />
        </Section>
      </div>

      <aside className="lg:sticky lg:top-6">
        <ReachPreview
          mode={mode}
          maxMinutes={maxMinutes}
          address={address.trim()}
          needs={needs}
          busy={busy}
          submitLabel={status === "searching" ? "Looking up the address…" : "Find resources"}
        />
      </aside>
    </form>
  );
}
