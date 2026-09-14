export type NeedCategory =
  | "food"
  | "housing"
  | "benefits"
  | "transportation"
  | "utilities"
  | "other";

export type TravelMode = "walking" | "transit" | "driving";

export const NEEDS: { id: NeedCategory; label: string; icon: string }[] = [
  { id: "food", label: "Food", icon: "🍎" },
  { id: "housing", label: "Housing / Shelter", icon: "🏠" },
  { id: "benefits", label: "Benefits (EBT / CalFresh)", icon: "💳" },
  { id: "transportation", label: "Transportation", icon: "🚌" },
  { id: "utilities", label: "Utilities", icon: "💡" },
  { id: "other", label: "Other", icon: "➕" },
];

export const TRAVEL_MODES: { id: TravelMode; label: string; icon: string }[] = [
  { id: "walking", label: "Walking", icon: "🚶" },
  { id: "transit", label: "Public transit", icon: "🚌" },
  { id: "driving", label: "Driving", icon: "🚗" },
];

export type Hours = { open: number; close: number } | null; // minutes from midnight

export interface Resource {
  id: string;
  name: string;
  category: NeedCategory;
  subtitle: string;
  description: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  /** Sunday..Saturday */
  hours: Hours[];
  walkIns: boolean;
  idRequired: boolean;
  free: boolean;
  languages: string[];
  capacity: "accepting" | "limited" | "waitlist";
  bring: string[];
  transitLine?: string;
  lastVerified: string;
}

const h = (open: string, close: string): Hours => {
  const m = (s: string) => {
    const parts = s.split(":").map(Number);
    return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  };
  return { open: m(open), close: m(close) };
};

const week = (open: string, close: string, days = [1, 2, 3, 4, 5]): Hours[] =>
  Array.from({ length: 7 }, (_, i) => (days.includes(i) ? h(open, close) : null));

export const RESOURCES: Resource[] = [
  {
    id: "community-food-center",
    name: "Community Food Center",
    category: "food",
    subtitle: "Grocery pantry & hot meals",
    description:
      "Free grocery boxes with fresh produce, plus a hot lunch service. No appointment needed; bilingual staff on site every day.",
    address: "11940 Firestone Blvd, Norwalk, CA 90650",
    phone: "562-555-0142",
    lat: 33.9081,
    lng: -118.0739,
    hours: week("09:00", "17:00", [1, 2, 3, 4, 5, 6]),
    walkIns: true,
    idRequired: false,
    free: true,
    languages: ["English", "Spanish"],
    capacity: "accepting",
    bring: ["Proof of address (optional)", "Reusable bags if you have them"],
    transitLine: "Bus 460",
    lastVerified: "2026-09-10",
  },
  {
    id: "st-marks-pantry",
    name: "St. Mark's Neighborhood Pantry",
    category: "food",
    subtitle: "Weekly food distribution",
    description:
      "Church-run pantry distributing shelf-stable staples and bread every Tuesday and Friday morning.",
    address: "13320 Pioneer Blvd, Norwalk, CA 90650",
    phone: "562-555-0188",
    lat: 33.8967,
    lng: -118.0812,
    hours: week("08:00", "12:00", [2, 5]),
    walkIns: true,
    idRequired: false,
    free: true,
    languages: ["English", "Spanish"],
    capacity: "limited",
    bring: ["Nothing required"],
    lastVerified: "2026-09-08",
  },
  {
    id: "harvest-mobile",
    name: "Harvest Mobile Food Drive",
    category: "food",
    subtitle: "Drive-up & walk-up produce",
    description:
      "Mobile produce truck parked at the civic center lot. Walk-up line is separate from the car line.",
    address: "12700 Norwalk Blvd, Norwalk, CA 90650",
    phone: "562-555-0119",
    lat: 33.9166,
    lng: -118.0856,
    hours: week("10:00", "14:00", [3, 6]),
    walkIns: true,
    idRequired: false,
    free: true,
    languages: ["English", "Spanish", "Tagalog"],
    capacity: "accepting",
    bring: ["Cart or bags"],
    transitLine: "Bus 125",
    lastVerified: "2026-09-12",
  },
  {
    id: "sunrise-shelter",
    name: "Sunrise Emergency Shelter",
    category: "housing",
    subtitle: "Overnight beds, intake daily",
    description:
      "Emergency overnight shelter with 42 beds. Intake starts at 4 PM; beds are assigned first come, first served.",
    address: "11511 Rosecrans Ave, Norwalk, CA 90650",
    phone: "562-555-0170",
    lat: 33.9021,
    lng: -118.0655,
    hours: week("16:00", "22:00", [0, 1, 2, 3, 4, 5, 6]),
    walkIns: true,
    idRequired: false,
    free: true,
    languages: ["English", "Spanish"],
    capacity: "limited",
    bring: ["Medications in original bottles", "One bag of belongings"],
    transitLine: "Bus 125",
    lastVerified: "2026-09-11",
  },
  {
    id: "casa-esperanza",
    name: "Casa Esperanza Family Housing",
    category: "housing",
    subtitle: "Family shelter & rapid rehousing",
    description:
      "Shelter for families with children, plus case management for rapid rehousing and rental deposits.",
    address: "14020 San Antonio Dr, Norwalk, CA 90650",
    phone: "562-555-0125",
    lat: 33.8894,
    lng: -118.0824,
    hours: week("09:00", "18:00", [1, 2, 3, 4, 5]),
    walkIns: false,
    idRequired: true,
    free: true,
    languages: ["English", "Spanish"],
    capacity: "waitlist",
    bring: ["Photo ID", "Birth certificates for children if available"],
    lastVerified: "2026-09-05",
  },
  {
    id: "housing-resource-center",
    name: "Housing Resource Center",
    category: "housing",
    subtitle: "Eviction help & rental assistance",
    description:
      "Walk-in counseling for eviction notices, rental assistance applications, and landlord mediation.",
    address: "12300 Imperial Hwy, Norwalk, CA 90650",
    phone: "562-555-0193",
    lat: 33.9169,
    lng: -118.0728,
    hours: week("08:30", "17:00", [1, 2, 3, 4, 5]),
    walkIns: true,
    idRequired: false,
    free: true,
    languages: ["English", "Spanish", "Korean"],
    capacity: "accepting",
    bring: ["Any notice you received", "Proof of address"],
    transitLine: "Bus 460",
    lastVerified: "2026-09-09",
  },
  {
    id: "benefits-enrollment",
    name: "Benefits Enrollment Center",
    category: "benefits",
    subtitle: "CalFresh / EBT application help",
    description:
      "Sit-down help completing CalFresh (EBT), Medi-Cal, and CalWORKs applications. Same-day submission in most cases.",
    address: "12440 Imperial Hwy, Norwalk, CA 90650",
    phone: "562-555-0161",
    lat: 33.9152,
    lng: -118.0799,
    hours: week("08:00", "18:00", [1, 2, 3, 4, 5]),
    walkIns: true,
    idRequired: true,
    free: true,
    languages: ["English", "Spanish", "Vietnamese"],
    capacity: "accepting",
    bring: ["Photo ID", "Income information if available", "Mail with your address"],
    transitLine: "Bus 460",
    lastVerified: "2026-09-10",
  },
  {
    id: "ebt-express",
    name: "EBT Express Help Desk",
    category: "benefits",
    subtitle: "Card replacement & balance help",
    description:
      "Replace a lost EBT card, reset a PIN, or check benefit status. Short visits, usually under 20 minutes.",
    address: "11929 Alondra Blvd, Norwalk, CA 90650",
    phone: "562-555-0134",
    lat: 33.8899,
    lng: -118.0716,
    hours: week("09:00", "16:00", [1, 2, 3, 4, 5]),
    walkIns: true,
    idRequired: true,
    free: true,
    languages: ["English", "Spanish"],
    capacity: "accepting",
    bring: ["Photo ID", "Case number if you know it"],
    lastVerified: "2026-09-07",
  },
  {
    id: "wic-office",
    name: "WIC Nutrition Office",
    category: "benefits",
    subtitle: "WIC enrollment for parents",
    description:
      "Enrollment and recertification for WIC food benefits for pregnant people and children under five.",
    address: "13000 Studebaker Rd, Norwalk, CA 90650",
    phone: "562-555-0177",
    lat: 33.8962,
    lng: -118.0942,
    hours: week("08:00", "16:30", [1, 2, 3, 4]),
    walkIns: false,
    idRequired: true,
    free: true,
    languages: ["English", "Spanish"],
    capacity: "accepting",
    bring: ["Photo ID", "Proof of address", "Child's immunization record"],
    lastVerified: "2026-09-03",
  },
  {
    id: "transit-pass-hub",
    name: "Community Transit Pass Hub",
    category: "transportation",
    subtitle: "Free & reduced bus passes",
    description:
      "Issues free 30-day transit passes for low-income riders and medical trip vouchers.",
    address: "12100 Firestone Blvd, Norwalk, CA 90650",
    phone: "562-555-0155",
    lat: 33.9075,
    lng: -118.0885,
    hours: week("09:00", "17:00", [1, 2, 3, 4, 5]),
    walkIns: true,
    idRequired: false,
    free: true,
    languages: ["English", "Spanish"],
    capacity: "accepting",
    bring: ["Proof of address or clinic referral"],
    transitLine: "Bus 125",
    lastVerified: "2026-09-11",
  },
  {
    id: "medical-rides",
    name: "Norwalk Medical Rides",
    category: "transportation",
    subtitle: "Rides to appointments",
    description:
      "Volunteer drivers for medical appointments. Book at least 48 hours ahead by phone.",
    address: "11700 Studebaker Rd, Norwalk, CA 90650",
    phone: "562-555-0146",
    lat: 33.9042,
    lng: -118.0951,
    hours: week("08:00", "15:00", [1, 2, 3, 4, 5]),
    walkIns: false,
    idRequired: false,
    free: true,
    languages: ["English", "Spanish"],
    capacity: "limited",
    bring: ["Appointment date and address"],
    lastVerified: "2026-09-02",
  },
  {
    id: "utility-relief",
    name: "Utility Relief Office",
    category: "utilities",
    subtitle: "Shutoff protection & bill help",
    description:
      "One-time payments toward overdue gas and electric bills, plus enrollment in discount rate programs.",
    address: "13100 Bloomfield Ave, Norwalk, CA 90650",
    phone: "562-555-0182",
    lat: 33.8971,
    lng: -118.0645,
    hours: week("09:00", "16:00", [1, 3, 5]),
    walkIns: true,
    idRequired: true,
    free: true,
    languages: ["English", "Spanish"],
    capacity: "limited",
    bring: ["Most recent utility bill", "Photo ID"],
    transitLine: "Bus 270",
    lastVerified: "2026-09-06",
  },
  {
    id: "water-assistance",
    name: "Water Bill Assistance Desk",
    category: "utilities",
    subtitle: "Water shutoff prevention",
    description: "Payment plans and credits for households facing a water shutoff notice.",
    address: "12600 Pioneer Blvd, Norwalk, CA 90650",
    phone: "562-555-0128",
    lat: 33.9108,
    lng: -118.0816,
    hours: week("10:00", "15:00", [2, 4]),
    walkIns: true,
    idRequired: false,
    free: true,
    languages: ["English", "Spanish"],
    capacity: "accepting",
    bring: ["Water bill or shutoff notice"],
    lastVerified: "2026-09-04",
  },
  {
    id: "neighborhood-hub",
    name: "Neighborhood Wellness Hub",
    category: "other",
    subtitle: "Clothing, showers, phone charging",
    description:
      "Drop-in center with showers, laundry, clothing closet, mail service, and phone charging.",
    address: "11800 Rosecrans Ave, Norwalk, CA 90650",
    phone: "562-555-0111",
    lat: 33.9024,
    lng: -118.0894,
    hours: week("08:00", "19:00", [0, 1, 2, 3, 4, 5, 6]),
    walkIns: true,
    idRequired: false,
    free: true,
    languages: ["English", "Spanish", "ASL"],
    capacity: "accepting",
    bring: ["Nothing required"],
    transitLine: "Bus 125",
    lastVerified: "2026-09-12",
  },
  {
    id: "legal-aid",
    name: "Free Legal Aid Clinic",
    category: "other",
    subtitle: "Benefits appeals & tenant rights",
    description:
      "Free attorney consults for denied benefits, tenant rights, and immigration questions.",
    address: "14100 Firestone Blvd, Norwalk, CA 90650",
    phone: "562-555-0198",
    lat: 33.9093,
    lng: -118.0612,
    hours: week("13:00", "18:00", [2, 4]),
    walkIns: false,
    idRequired: false,
    free: true,
    languages: ["English", "Spanish"],
    capacity: "waitlist",
    bring: ["Any paperwork about your case"],
    lastVerified: "2026-08-29",
  },
];

/* ---------------- geo + travel ---------------- */

export interface PatientLocation {
  address: string;
  lat: number;
  lng: number;
}

/** Lightweight deterministic geocode: keeps demo self-contained and offline. */
export function geocode(address: string): PatientLocation {
  const base = { lat: 33.9022, lng: -118.0817 };
  let hash = 0;
  for (let i = 0; i < address.length; i++) hash = (hash * 31 + address.charCodeAt(i)) | 0;
  const jitter = (n: number) => ((Math.abs(hash >> n) % 1000) / 1000 - 0.5) * 0.012;
  return {
    address: address.trim(),
    lat: +(base.lat + jitter(3)).toFixed(5),
    lng: +(base.lng + jitter(9)).toFixed(5),
  };
}

export function distanceMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

const MODE_PROFILE: Record<TravelMode, { mph: number; overhead: number; detour: number }> = {
  walking: { mph: 3, overhead: 0, detour: 1.25 },
  transit: { mph: 11, overhead: 9, detour: 1.4 },
  driving: { mph: 24, overhead: 4, detour: 1.3 },
};

export function travelMinutes(miles: number, mode: TravelMode): number {
  const p = MODE_PROFILE[mode];
  return Math.max(1, Math.round((miles * p.detour * 60) / p.mph + p.overhead));
}

/** Radius in miles realistically reachable within maxMinutes. */
export function reachableMiles(maxMinutes: number, mode: TravelMode): number {
  const p = MODE_PROFILE[mode];
  return Math.max(0.2, ((maxMinutes - p.overhead) * p.mph) / 60 / p.detour);
}

export function travelLabel(minutes: number, mode: TravelMode, r: Resource): string {
  if (mode === "walking") return `${minutes} min walk`;
  if (mode === "driving") return `${minutes} min drive`;
  return r.transitLine ? `${minutes} min • ${r.transitLine}` : `${minutes} min by bus`;
}

/* ---------------- open status ---------------- */

export interface OpenStatus {
  open: boolean;
  label: string;
  closingSoon: boolean;
}

export function openStatus(r: Resource, now: Date): OpenStatus {
  const today = r.hours[now.getDay()];
  const mins = now.getHours() * 60 + now.getMinutes();
  const fmt = (m: number) => {
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    const ampm = hh >= 12 ? "PM" : "AM";
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    return `${h12}${mm ? ":" + String(mm).padStart(2, "0") : ""} ${ampm}`;
  };
  if (today && mins >= today.open && mins < today.close) {
    const left = today.close - mins;
    return {
      open: true,
      label: left <= 45 ? `Closes in ${left} min` : `Open until ${fmt(today.close)}`,
      closingSoon: left <= 45,
    };
  }
  if (today && mins < today.open) {
    return { open: false, label: `Opens today ${fmt(today.open)}`, closingSoon: false };
  }
  for (let i = 1; i <= 7; i++) {
    const d = (now.getDay() + i) % 7;
    const hrs = r.hours[d];
    if (hrs) {
      const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d];
      return { open: false, label: `Opens ${day} ${fmt(hrs.open)}`, closingSoon: false };
    }
  }
  return { open: false, label: "Call for hours", closingSoon: false };
}

export function hoursSummary(r: Resource): string {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const fmt = (m: number) => {
    const hh = Math.floor(m / 60);
    const ampm = hh >= 12 ? "PM" : "AM";
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    const mm = m % 60;
    return `${h12}${mm ? ":" + String(mm).padStart(2, "0") : ""}${ampm}`;
  };
  return r.hours
    .map((hrs, i) => (hrs ? `${names[i]} ${fmt(hrs.open)}–${fmt(hrs.close)}` : null))
    .filter(Boolean)
    .join(" · ");
}

/* ---------------- halo match ---------------- */

export interface SearchCriteria {
  location: PatientLocation;
  needs: NeedCategory[];
  mode: TravelMode;
  maxMinutes: number;
  language?: string;
  noIdOnly?: boolean;
}

export interface Signal {
  ok: boolean;
  label: string;
}

export interface Match {
  resource: Resource;
  miles: number;
  minutes: number;
  score: number;
  status: OpenStatus;
  signals: Signal[];
  travel: string;
}

export function scoreResources(c: SearchCriteria, now: Date): Match[] {
  const pool = RESOURCES.filter((r) => c.needs.length === 0 || c.needs.includes(r.category));
  return pool
    .map((r) => {
      const miles = distanceMiles(c.location, r);
      const minutes = travelMinutes(miles, c.mode);
      const status = openStatus(r, now);

      // Feasibility is the backbone: how much of the patient's travel budget is left.
      const feasibility = Math.max(0, 1 - minutes / c.maxMinutes);
      let score = 40 + feasibility * 35;
      if (minutes > c.maxMinutes) score -= 30;
      if (status.open) score += 10;
      if (status.closingSoon) score -= 6;
      if (r.walkIns) score += 6;
      if (!r.idRequired) score += 4;
      if (r.free) score += 3;
      if (r.capacity === "accepting") score += 5;
      if (r.capacity === "waitlist") score -= 10;
      if (c.language && r.languages.includes(c.language)) score += 4;
      if (c.noIdOnly && r.idRequired) score -= 25;

      const signals: Signal[] = [
        { ok: status.open, label: status.label },
        { ok: r.walkIns, label: r.walkIns ? "Walk-ins accepted" : "Appointment needed" },
        { ok: !r.idRequired, label: r.idRequired ? "ID required" : "No ID required" },
        { ok: r.free, label: r.free ? "Free" : "Fees may apply" },
        {
          ok: r.capacity !== "waitlist",
          label:
            r.capacity === "accepting"
              ? "Currently accepting clients"
              : r.capacity === "limited"
                ? "Limited capacity today"
                : "Waitlist",
        },
        { ok: r.languages.length > 1, label: r.languages.join(", ") },
        {
          ok: minutes <= c.maxMinutes,
          label:
            minutes <= c.maxMinutes
              ? "Within travel limit"
              : `${minutes - c.maxMinutes} min over travel limit`,
        },
      ];

      return {
        resource: r,
        miles,
        minutes,
        score: Math.max(5, Math.min(99, Math.round(score))),
        status,
        signals,
        travel: travelLabel(minutes, c.mode, r),
      };
    })
    .sort((a, b) => b.score - a.score);
}

/** Greedy nearest-hop itinerary from home through selected stops. */
export function buildRoute(
  start: { lat: number; lng: number },
  stops: Resource[],
  mode: TravelMode,
) {
  const remaining = [...stops];
  let cur = { lat: start.lat, lng: start.lng };
  const legs: { resource: Resource; minutes: number; miles: number; travel: string }[] = [];
  while (remaining.length) {
    let bi = 0;
    let bd = Infinity;
    remaining.forEach((r, i) => {
      const d = distanceMiles(cur, r);
      if (d < bd) {
        bd = d;
        bi = i;
      }
    });
    const next = remaining.splice(bi, 1)[0];
    if (!next) break;
    const minutes = travelMinutes(bd, mode);
    legs.push({ resource: next, minutes, miles: bd, travel: travelLabel(minutes, mode, next) });
    cur = { lat: next.lat, lng: next.lng };
  }
  const totalTravel = legs.reduce((s, l) => s + l.minutes, 0);
  const totalVisit = legs.length * 25;
  return { legs, totalMinutes: totalTravel + totalVisit };
}

export function categoryMeta(c: NeedCategory) {
  return NEEDS.find((n) => n.id === c) ?? NEEDS[5];
}

export function formatMinutes(total: number) {
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return hh ? `${hh} hr ${mm} min` : `${mm} min`;
}
