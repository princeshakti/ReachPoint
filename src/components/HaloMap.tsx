import { useEffect, useRef, useState } from "react";
import { categoryMeta, type Match, type PatientLocation } from "@/lib/halo";
import { loadGoogleMaps } from "@/lib/google-maps-loader";

interface Props {
  center: PatientLocation;
  matches: Match[];
  reachMiles: number;
  selectedId?: string | null;
  planIds: string[];
  onSelect: (id: string) => void;
}

const METERS_PER_MILE = 1609.34;

function pinIcon(icon: string, active: boolean, selected: boolean): google.maps.Symbol | string {
  const fill = active ? "#0f766e" : "#ffffff";
  const text = active ? "#ffffff" : "#0f172a";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="52" viewBox="0 0 44 52">
    <path d="M22 51C22 51 41 31.5 41 20A19 19 0 1 0 3 20c0 11.5 19 31 19 31z" fill="${fill}" stroke="${selected ? "#f59e0b" : "#0f766e"}" stroke-width="${selected ? 4 : 2.5}"/>
    <text x="22" y="26" font-size="17" text-anchor="middle" fill="${text}">${icon}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function HaloMap({ center, matches, reachMiles, selectedId, planIds, onSelect }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const homeRef = useRef<google.maps.Marker | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Init
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !ref.current) return;
        mapRef.current = new maps.Map(ref.current, {
          center: { lat: center.lat, lng: center.lng },
          zoom: 14,
          clickableIcons: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setError("Map could not be loaded.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Center + reach circle
  useEffect(() => {
    const map = mapRef.current;
    if (!loaded || !map) return;
    const pos = { lat: center.lat, lng: center.lng };
    map.setCenter(pos);

    if (!homeRef.current) {
      homeRef.current = new google.maps.Marker({
        map,
        position: pos,
        zIndex: 999,
        title: center.address,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: "#0f766e",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      });
    } else {
      homeRef.current.setPosition(pos);
    }

    if (!circleRef.current) {
      circleRef.current = new google.maps.Circle({
        map,
        center: pos,
        radius: reachMiles * METERS_PER_MILE,
        fillColor: "#14b8a6",
        fillOpacity: 0.16,
        strokeColor: "#0d9488",
        strokeOpacity: 0.7,
        strokeWeight: 2,
        clickable: false,
      });
    } else {
      circleRef.current.setCenter(pos);
      circleRef.current.setRadius(reachMiles * METERS_PER_MILE);
    }

    const bounds = circleRef.current.getBounds();
    if (bounds) map.fitBounds(bounds, 24);
  }, [loaded, center.lat, center.lng, center.address, reachMiles]);

  // Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!loaded || !map) return;
    const seen = new Set<string>();

    for (const m of matches) {
      const id = m.resource.id;
      seen.add(id);
      const active = planIds.includes(id);
      const selected = selectedId === id;
      const icon = pinIcon(categoryMeta(m.resource.category).icon, active, selected);
      const position = { lat: m.resource.lat, lng: m.resource.lng };
      const existing = markersRef.current.get(id);
      if (existing) {
        existing.setPosition(position);
        existing.setIcon({
          url: icon,
          scaledSize: new google.maps.Size(selected ? 46 : 38, selected ? 54 : 45),
        });
        existing.setZIndex(selected ? 900 : active ? 500 : 100);
      } else {
        const marker = new google.maps.Marker({
          map,
          position,
          title: m.resource.name,
          icon: {
            url: icon,
            scaledSize: new google.maps.Size(selected ? 46 : 38, selected ? 54 : 45),
          },
          zIndex: selected ? 900 : active ? 500 : 100,
        });
        marker.addListener("click", () => onSelect(id));
        markersRef.current.set(id, marker);
      }
    }

    for (const [id, marker] of markersRef.current) {
      if (!seen.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    }
  }, [loaded, matches, planIds, selectedId, onSelect]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-map ring-1 ring-border">
      <div ref={ref} className="h-full w-full" />
      {!loaded && !error && (
        <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
          Loading map…
        </div>
      )}
      {error && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted-foreground">
          {error}
        </div>
      )}
      <div className="pointer-events-none absolute bottom-6 left-3 rounded-lg bg-card/90 px-3 py-2 text-xs text-muted-foreground shadow-sm ring-1 ring-border backdrop-blur">
        Shaded area = realistically reachable · {reachMiles.toFixed(1)} mi equivalent
      </div>
    </div>
  );
}
