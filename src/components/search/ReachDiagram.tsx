import { REFERENCE_RADIUS_MILES } from "@/lib/travel";

const SIZE = 240;
const CENTER = SIZE / 2;
const BASE_RADIUS = 100;
const ORIGIN = `${CENTER}px ${CENTER}px`;
const GROW = "transform 450ms cubic-bezier(0.2, 0.8, 0.2, 1)";

interface ReachDiagramProps {
  reachMiles: number;
  description: string;
}

/**
 * Draws, to scale, how far the patient can really get next to the 3-mile
 * circle most searches use. It resizes as the travel options change, which is
 * the whole idea behind ReachPoint in one picture.
 */
export function ReachDiagram({ reachMiles, description }: ReachDiagramProps) {
  const viewMiles = Math.max(reachMiles, REFERENCE_RADIUS_MILES) * 1.08;
  const referenceScale = REFERENCE_RADIUS_MILES / viewMiles;
  const reachScale = reachMiles / viewMiles;

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={description} className="block w-full">
      <defs>
        <pattern id="reach-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" strokeWidth="1" className="stroke-line" />
        </pattern>
      </defs>
      <rect width={SIZE} height={SIZE} rx="14" className="fill-reach-wash" />
      <rect width={SIZE} height={SIZE} rx="14" fill="url(#reach-grid)" />

      <circle
        cx={CENTER}
        cy={CENTER}
        r={BASE_RADIUS}
        fill="none"
        strokeWidth="1.5"
        strokeDasharray="5 5"
        vectorEffect="non-scaling-stroke"
        className="stroke-ink-soft"
        style={{ transform: `scale(${referenceScale})`, transformOrigin: ORIGIN, transition: GROW }}
      />
      <circle
        cx={CENTER}
        cy={CENTER}
        r={BASE_RADIUS}
        strokeWidth="2"
        fillOpacity="0.2"
        vectorEffect="non-scaling-stroke"
        className="fill-reach stroke-reach"
        style={{ transform: `scale(${reachScale})`, transformOrigin: ORIGIN, transition: GROW }}
      />
      <circle cx={CENTER} cy={CENTER} r="5.5" strokeWidth="2.5" className="fill-home stroke-white" />
    </svg>
  );
}
