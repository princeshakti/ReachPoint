import { categoryMeta, type Match, type PatientLocation } from "@/lib/halo";

interface Props {
  center: PatientLocation;
  matches: Match[];
  reachMiles: number;
  selectedId?: string | null;
  planIds: string[];
  onSelect: (id: string) => void;
}

const MILES_PER_DEG_LAT = 69;

export function HaloMap({ center, matches, reachMiles, selectedId, planIds, onSelect }: Props) {
  const span = Math.max(reachMiles * 1.55, 1.4); // miles from center to edge
  const size = 100; // viewBox units
  const milesPerDegLng = MILES_PER_DEG_LAT * Math.cos((center.lat * Math.PI) / 180);

  const project = (lat: number, lng: number) => {
    const dx = ((lng - center.lng) * milesPerDegLng) / span;
    const dy = ((lat - center.lat) * MILES_PER_DEG_LAT) / span;
    return { x: 50 + dx * 50, y: 50 - dy * 50 };
  };

  const haloR = (reachMiles / span) * 50;
  // Irregular accessibility halo — real reach is not a perfect circle.
  const blob = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const wobble = 0.82 + 0.22 * Math.sin(a * 3 + 1.1) + 0.1 * Math.sin(a * 5 + 0.4);
    return `${(50 + Math.cos(a) * haloR * wobble).toFixed(2)},${(50 + Math.sin(a) * haloR * wobble).toFixed(2)}`;
  }).join(" ");

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-map ring-1 ring-border">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
        <defs>
          <radialGradient id="haloFill" cx="50%" cy="50%">
            <stop offset="0%" stopColor="var(--halo-core)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--halo-edge)" stopOpacity="0.12" />
          </radialGradient>
          <pattern id="grid" width="6.25" height="6.25" patternUnits="userSpaceOnUse">
            <path
              d="M 6.25 0 L 0 0 0 6.25"
              fill="none"
              stroke="var(--map-line)"
              strokeWidth="0.25"
            />
          </pattern>
        </defs>

        <rect width={size} height={size} fill="url(#grid)" />
        <path d="M0,62 L100,54" stroke="var(--map-road)" strokeWidth="1.4" fill="none" />
        <path d="M44,0 L50,100" stroke="var(--map-road)" strokeWidth="1.4" fill="none" />
        <path d="M0,26 L100,32" stroke="var(--map-road)" strokeWidth="0.9" fill="none" />
        <path d="M76,0 L70,100" stroke="var(--map-road)" strokeWidth="0.9" fill="none" />

        <polygon
          points={blob}
          fill="url(#haloFill)"
          stroke="var(--halo-edge)"
          strokeWidth="0.5"
          strokeDasharray="1.6 1.2"
        />

        {matches.map((m) => {
          const p = project(m.resource.lat, m.resource.lng);
          if (p.x < 2 || p.x > 98 || p.y < 2 || p.y > 98) return null;
          const selected = selectedId === m.resource.id;
          const inPlan = planIds.includes(m.resource.id);
          return (
            <g
              key={m.resource.id}
              transform={`translate(${p.x} ${p.y})`}
              onClick={() => onSelect(m.resource.id)}
              className="cursor-pointer"
            >
              <circle
                r={selected ? 4.6 : 3.6}
                fill={inPlan ? "var(--pin-active)" : "var(--pin)"}
                stroke="var(--pin-ring)"
                strokeWidth={selected ? 1.2 : 0.7}
              />
              <text
                y="1.4"
                textAnchor="middle"
                fontSize="3.4"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {categoryMeta(m.resource.category).icon}
              </text>
            </g>
          );
        })}

        <g transform="translate(50 50)">
          <circle r="7" fill="var(--home-pulse)" opacity="0.25" />
          <circle r="3.2" fill="var(--home)" stroke="white" strokeWidth="1" />
        </g>
      </svg>

      <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-card/90 px-3 py-2 text-xs text-muted-foreground shadow-sm ring-1 ring-border backdrop-blur">
        Shaded area = realistically reachable · {reachMiles.toFixed(1)} mi equivalent
      </div>
    </div>
  );
}
