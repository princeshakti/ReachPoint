/**
 * Everything that talks to Google lives here and runs only on the server, so
 * the API key never has to be bundled into the page for these calls.
 * `*.server.ts` files cannot be imported by browser code.
 */
import type { ApiResult, LatLng, NeedId, PatientLocation, Resource, TimeRange, WeekHours } from "@/lib/types";

const GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const REQUEST_TIMEOUT_MS = 12_000;
const METERS_PER_MILE = 1609.34;
const MAX_BIAS_RADIUS_METERS = 50_000;
const MINUTES_PER_DAY = 1440;

/* ---------------- configuration and errors ---------------- */

type FailureCode = Extract<ApiResult<never>, { ok: false }>["code"];

const HINT_NOT_CONFIGURED =
  "Google Maps isn't set up. Add GOOGLE_MAPS_API_KEY to the .env file and restart the server.";
const HINT_QUOTA = "Google Maps is over its usage limit right now. Try again later.";
const HINT_REJECTED =
  "Google rejected the request. Check that the Geocoding API and Places API (New) are enabled and billing is on for your key.";
const HINT_NETWORK = "Couldn't reach Google Maps. Check the connection and try again.";

export class GoogleMapsError extends Error {
  readonly code: FailureCode;
  readonly userMessage: string;

  constructor(code: FailureCode, detail: string, userMessage: string) {
    super(detail);
    this.name = "GoogleMapsError";
    this.code = code;
    this.userMessage = userMessage;
  }
}

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function serverKey(): string {
  const key = readEnv("GOOGLE_MAPS_API_KEY");
  if (!key) {
    throw new GoogleMapsError("not_configured", "GOOGLE_MAPS_API_KEY is not set", HINT_NOT_CONFIGURED);
  }
  return key;
}

/** The key sent to the browser for the map. A separate referrer-restricted key can be provided. */
export function browserKey(): string | null {
  return readEnv("GOOGLE_MAPS_BROWSER_KEY") ?? readEnv("GOOGLE_MAPS_API_KEY") ?? null;
}

/** Turn any error into a failure result that is safe to show the user. Details go to the server log only. */
export function toFailure(error: unknown): Extract<ApiResult<never>, { ok: false }> {
  if (error instanceof GoogleMapsError) {
    console.error(`[google-maps] ${error.code}: ${error.message}`);
    return { ok: false, code: error.code, message: error.userMessage };
  }
  console.error("[google-maps] unexpected error", error);
  return { ok: false, code: "google_error", message: HINT_NETWORK };
}

async function fetchJson<T>(label: string, url: string | URL, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (cause) {
    throw new GoogleMapsError("google_error", `${label}: network error (${String(cause)})`, HINT_NETWORK);
  }
  if (response.status === 429) {
    throw new GoogleMapsError("quota", `${label}: HTTP 429`, HINT_QUOTA);
  }
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new GoogleMapsError("google_error", `${label}: HTTP ${response.status} ${text.slice(0, 300)}`, HINT_REJECTED);
  }
  return (await response.json()) as T;
}

/* ---------------- geocoding ---------------- */

interface GeocodeResponse {
  status: string;
  error_message?: string;
  results?: { formatted_address: string; geometry: { location: LatLng } }[];
}

async function geocodeRequest(params: Record<string, string>): Promise<PatientLocation[]> {
  const url = new URL(GEOCODING_URL);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  url.searchParams.set("key", serverKey());

  const body = await fetchJson<GeocodeResponse>("Geocoding", url, { method: "GET" });
  switch (body.status) {
    case "OK":
      return (body.results ?? []).map((result) => ({
        address: result.formatted_address,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      }));
    case "ZERO_RESULTS":
      return [];
    case "OVER_QUERY_LIMIT":
    case "OVER_DAILY_LIMIT":
      throw new GoogleMapsError("quota", `Geocoding: ${body.status}`, HINT_QUOTA);
    default:
      throw new GoogleMapsError(
        "google_error",
        `Geocoding: ${body.status} ${body.error_message ?? ""}`.trim(),
        HINT_REJECTED,
      );
  }
}

/** Look up an address typed by the care team. Returns `null` when Google finds no match. */
export async function geocodeAddress(address: string): Promise<PatientLocation | null> {
  // `region` biases ambiguous addresses toward the US without excluding anywhere else.
  const results = await geocodeRequest({ address, region: "us" });
  return results[0] ?? null;
}

export async function reverseGeocode(point: LatLng): Promise<PatientLocation | null> {
  const results = await geocodeRequest({ latlng: `${point.lat},${point.lng}` });
  return results[0] ?? null;
}

/* ---------------- places ---------------- */

/** What to ask Google for each kind of need. Each need runs every query and the results are merged. */
const QUERIES: Record<NeedId, string[]> = {
  food: ["food pantry", "food bank", "free community meals"],
  housing: ["homeless shelter", "emergency housing assistance"],
  benefits: ["CalFresh EBT office", "social services benefits office", "WIC office"],
  transportation: ["transit customer center", "medical transportation service"],
  utilities: ["utility bill assistance program", "community action agency"],
  other: ["community resource center", "free legal aid clinic"],
};

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.nationalPhoneNumber",
  "places.regularOpeningHours",
  "places.primaryTypeDisplayName",
  "places.websiteUri",
  "places.businessStatus",
].join(",");

interface GoogleTime {
  day?: number;
  hour?: number;
  minute?: number;
}

interface GooglePeriod {
  open?: GoogleTime;
  close?: GoogleTime;
}

interface GooglePlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  nationalPhoneNumber?: string;
  regularOpeningHours?: { periods?: GooglePeriod[] };
  primaryTypeDisplayName?: { text?: string };
  websiteUri?: string;
  businessStatus?: string;
}

async function textSearch(query: string, center: LatLng, radiusMeters: number): Promise<GooglePlace[]> {
  const body = await fetchJson<{ places?: GooglePlace[] }>("Places search", PLACES_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": serverKey(),
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      pageSize: 20,
      locationBias: {
        circle: { center: { latitude: center.lat, longitude: center.lng }, radius: radiusMeters },
      },
    }),
  });
  return body.places ?? [];
}

function addRange(week: WeekHours, day: number | undefined, range: TimeRange) {
  if (day === undefined || day < 0 || day > 6) return;
  week[day]?.push(range);
}

/**
 * Convert Google's open/close periods into per-day ranges. A period that runs
 * past midnight is split across the two days, and a period with no closing
 * time means the place is open around the clock.
 */
export function toWeekHours(periods: GooglePeriod[] | undefined): WeekHours | null {
  if (!periods || periods.length === 0) return null;

  const week: WeekHours = Array.from({ length: 7 }, () => []);
  for (const period of periods) {
    const open = period.open;
    if (!open) continue;

    if (!period.close) {
      for (let day = 0; day < 7; day++) addRange(week, day, { open: 0, close: MINUTES_PER_DAY });
      continue;
    }

    const start = (open.hour ?? 0) * 60 + (open.minute ?? 0);
    const end = (period.close.hour ?? 0) * 60 + (period.close.minute ?? 0);

    if (period.close.day === open.day && end > start) {
      addRange(week, open.day, { open: start, close: end });
    } else {
      addRange(week, open.day, { open: start, close: MINUTES_PER_DAY });
      if (end > 0) addRange(week, period.close.day, { open: 0, close: end });
    }
  }

  for (const day of week) day.sort((a, b) => a.open - b.open);
  return week;
}

function toResource(place: GooglePlace, need: NeedId, query: string, retrievedOn: string): Resource | null {
  if (!place.id || !place.location) return null;
  if (place.businessStatus && place.businessStatus !== "OPERATIONAL") return null;

  return {
    id: place.id,
    name: place.displayName?.text ?? "Community resource",
    need,
    kind: place.primaryTypeDisplayName?.text ?? query,
    address: place.formattedAddress ?? "",
    phone: place.nationalPhoneNumber ?? null,
    website: place.websiteUri ?? null,
    lat: place.location.latitude,
    lng: place.location.longitude,
    hours: toWeekHours(place.regularOpeningHours?.periods),
    retrievedOn,
  };
}

export interface ResourceSearch {
  resources: Resource[];
  /** True when some searches failed but others worked, so the list may be incomplete. */
  partial: boolean;
}

export async function searchResources(
  center: LatLng,
  needs: readonly NeedId[],
  radiusMiles: number,
): Promise<ResourceSearch> {
  const radiusMeters = Math.min(MAX_BIAS_RADIUS_METERS, Math.round(radiusMiles * METERS_PER_MILE));
  const jobs = needs.flatMap((need) => QUERIES[need].map((query) => ({ need, query })));
  const settled = await Promise.allSettled(jobs.map((job) => textSearch(job.query, center, radiusMeters)));

  const failures = settled.filter((outcome): outcome is PromiseRejectedResult => outcome.status === "rejected");
  const [firstFailure] = failures;
  if (firstFailure && failures.length === settled.length) throw firstFailure.reason;
  for (const failure of failures) console.error("[google-maps] one search failed", failure.reason);

  const retrievedOn = new Date().toISOString().slice(0, 10);
  const seen = new Set<string>();
  const resources: Resource[] = [];

  settled.forEach((outcome, index) => {
    const job = jobs[index];
    if (!job || outcome.status !== "fulfilled") return;
    for (const place of outcome.value) {
      const resource = toResource(place, job.need, job.query, retrievedOn);
      if (!resource || seen.has(resource.id)) continue;
      seen.add(resource.id);
      resources.push(resource);
    }
  });

  return { resources, partial: failures.length > 0 };
}
