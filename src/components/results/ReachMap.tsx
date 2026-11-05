import { Loader2, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps, MapsLoadError, onMapsAuthFailure } from "@/lib/google-maps-loader";
import type { Match } from "@/lib/scoring";
import type { PatientLocation } from "@/lib/types";

const METERS_PER_MILE = 1609.34;

const PROBLEM_AUTH =
  "Google rejected the map key. In Google Cloud, enable the Maps JavaScript API, turn on billing, and make sure the key's restrictions allow this address.";
const PROBLEM_NOT_CONFIGURED =
  "The map needs a Google Maps key. Add GOOGLE_MAPS_API_KEY to the .env file and restart the server.";
const PROBLEM_LOAD = "The map couldn't load. Check the connection and refresh the page.";

interface ReachMapProps {
  center: PatientLocation;
  reachMiles: number;
  /** Text for the key in the corner, for example "Reachable on foot in 15 min". */
  caption: string;
  matches: readonly Match[];
  selectedId: string | null;
  planIds: readonly string[];
  onSelect: (id: string) => void;
}

function pinIcon(state: { inPlan: boolean; selected: boolean; outside: boolean }): google.maps.Icon {
  const width = state.selected ? 40 : 32;
  const height = Math.round(width * 1.25);
  const fill = state.inPlan ? "#0e6b66" : "#ffffff";
  const stroke = state.selected ? "#f0b429" : state.outside ? "#7d918e" : "#0e6b66";
  const dot = state.inPlan ? "#ffffff" : state.outside ? "#7d918e" : "#0e6b66";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 32 40"><path d="M16 38C16 38 29 24 29 14A13 13 0 1 0 3 14c0 10 13 24 13 24z" fill="${fill}" stroke="${stroke}" stroke-width="${state.selected ? 4 : 3}"/><circle cx="16" cy="14" r="5" fill="${dot}"/></svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(width, height),
    anchor: new google.maps.Point(width / 2, height),
  };
}

/** A live Google Map: the patient's position, the area they can reach, and a pin for each result. */
export function ReachMap({ center, reachMiles, caption, matches, selectedId, planIds, onSelect }: ReachMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const homeRef = useRef<google.maps.Marker | null>(null);
  const markersRef = useRef(new Map<string, google.maps.Marker>());
  const onSelectRef = useRef(onSelect);
  const initialCenter = useRef(center).current;

  const [ready, setReady] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Load Google Maps and create the map once.
  useEffect(() => {
    let cancelled = false;
    const markers = markersRef.current;
    const stopWatchingAuth = onMapsAuthFailure(() => setProblem(PROBLEM_AUTH));

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new maps.Map(containerRef.current, {
          center: { lat: initialCenter.lat, lng: initialCenter.lng },
          zoom: 14,
          clickableIcons: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        setReady(true);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setProblem(
          error instanceof MapsLoadError && error.reason === "not_configured" ? PROBLEM_NOT_CONFIGURED : PROBLEM_LOAD,
        );
      });

    return () => {
      cancelled = true;
      stopWatchingAuth();
      markers.forEach((marker) => marker.setMap(null));
      markers.clear();
      circleRef.current?.setMap(null);
      homeRef.current?.setMap(null);
      circleRef.current = null;
      homeRef.current = null;
      mapRef.current = null;
    };
  }, [initialCenter]);

  // The patient's position and the shaded reachable area.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;

    const position = { lat: center.lat, lng: center.lng };
    const radius = reachMiles * METERS_PER_MILE;

    if (homeRef.current) {
      homeRef.current.setPosition(position);
    } else {
      homeRef.current = new google.maps.Marker({
        map,
        position,
        title: center.address,
        zIndex: 999,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: "#27408b",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      });
    }

    if (circleRef.current) {
      circleRef.current.setCenter(position);
      circleRef.current.setRadius(radius);
    } else {
      circleRef.current = new google.maps.Circle({
        map,
        center: position,
        radius,
        fillColor: "#0e6b66",
        fillOpacity: 0.14,
        strokeColor: "#0e6b66",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        clickable: false,
      });
    }

    const bounds = circleRef.current.getBounds();
    if (bounds) map.fitBounds(bounds, 32);
  }, [ready, center.lat, center.lng, center.address, reachMiles]);

  // One pin per result. Pins change colour for places in the plan and the selected place.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;

    const markers = markersRef.current;
    const current = new Set<string>();

    for (const match of matches) {
      const { resource } = match;
      current.add(resource.id);
      const icon = pinIcon({
        inPlan: planIds.includes(resource.id),
        selected: selectedId === resource.id,
        outside: !match.withinReach,
      });
      const zIndex = selectedId === resource.id ? 900 : planIds.includes(resource.id) ? 500 : 100;

      const existing = markers.get(resource.id);
      if (existing) {
        existing.setIcon(icon);
        existing.setZIndex(zIndex);
      } else {
        const marker = new google.maps.Marker({
          map,
          position: { lat: resource.lat, lng: resource.lng },
          title: resource.name,
          icon,
          zIndex,
        });
        marker.addListener("click", () => onSelectRef.current(resource.id));
        markers.set(resource.id, marker);
      }
    }

    for (const [id, marker] of markers) {
      if (!current.has(id)) {
        marker.setMap(null);
        markers.delete(id);
      }
    }
  }, [ready, matches, planIds, selectedId]);

  // Bring the selected pin into view if it is off screen.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !selectedId) return;
    const position = markersRef.current.get(selectedId)?.getPosition();
    if (position && !map.getBounds()?.contains(position)) map.panTo(position);
  }, [ready, selectedId]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-panel border border-line bg-reach-wash">
      <div ref={containerRef} className="h-full w-full" />

      {!ready && !problem && (
        <div className="absolute inset-0 grid place-items-center">
          <p className="flex items-center gap-2 text-sm font-bold text-ink-soft">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Loading map…
          </p>
        </div>
      )}

      {problem && (
        <div role="alert" className="absolute inset-0 grid place-items-center bg-reach-wash p-6 text-center">
          <div className="max-w-sm">
            <TriangleAlert className="mx-auto size-8 text-amber-ink" aria-hidden="true" />
            <p className="mt-3 text-sm font-bold">{problem}</p>
          </div>
        </div>
      )}

      {ready && !problem && (
        <p className="pointer-events-none absolute bottom-6 left-3 max-w-[calc(100%-1.5rem)] rounded-lg bg-surface/95 px-3 py-2 text-xs font-bold text-ink-soft shadow-sm ring-1 ring-line">
          {caption}
        </p>
      )}
    </div>
  );
}
