import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Hours, NeedCategory, PatientLocation, Resource } from "./reachpoint";

// Calls Google's own APIs directly with a standard server-side Google Maps
// API key — no Lovable account or connector required. Set GOOGLE_MAPS_API_KEY
// in your server environment, with the Geocoding API and Places API (New)
// enabled on that key in Google Cloud Console.
function mapsKey(): string {
  const key = process.env["GOOGLE_MAPS_API_KEY"];
  if (!key) {
    throw new Error(
      "GOOGLE_MAPS_API_KEY is not set on the server. Add it to your .env (see .env.example).",
    );
  }
  return key;
}

async function geocodeJson(query: string) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?${query}&key=${mapsKey()}`;
  const res = await fetch(url);
  const json: any = await res.json();
  if (json.status !== "OK") {
    // Surface Google's own reason (e.g. REQUEST_DENIED, OVER_QUERY_LIMIT) so
    // it shows up in server logs instead of a generic failure.
    console.error(`Geocoding failed [${json.status}]: ${json.error_message ?? "no details"}`);
    throw new Error(json.error_message || `Geocoding failed: ${json.status}`);
  }
  return json;
}

async function placesSearchText(body: Record<string, unknown>) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": mapsKey(),
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.regularOpeningHours,places.primaryTypeDisplayName,places.websiteUri,places.businessStatus",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.text();
    console.error(`Places search failed [${res.status}]: ${errBody}`);
    throw new Error(`Places search failed [${res.status}]`);
  }
  return res.json() as Promise<any>;
}

/* ---------------- geocoding ---------------- */

export const geocodeAddress = createServerFn({ method: "POST" })
  .validator((d) => z.object({ address: z.string().min(3).max(200) }).parse(d))
  .handler(async ({ data }): Promise<PatientLocation> => {
    const json = await geocodeJson(`address=${encodeURIComponent(data.address)}`);
    const first = json?.results?.[0];
    if (!first) throw new Error("We couldn't find that address. Try adding the city or ZIP code.");
    return {
      address: first.formatted_address as string,
      lat: first.geometry.location.lat as number,
      lng: first.geometry.location.lng as number,
    };
  });

export const reverseGeocode = createServerFn({ method: "POST" })
  .validator((d) =>
    z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).parse(d),
  )
  .handler(async ({ data }): Promise<PatientLocation> => {
    const json = await geocodeJson(`latlng=${data.lat},${data.lng}`);
    const first = json?.results?.[0];
    return {
      address: (first?.formatted_address as string) ?? `${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`,
      lat: data.lat,
      lng: data.lng,
    };
  });

/* ---------------- nearby resources ---------------- */

const QUERIES: Record<NeedCategory, string[]> = {
  food: ["food pantry", "food bank", "free community meals"],
  housing: ["homeless shelter", "emergency housing assistance"],
  benefits: ["CalFresh EBT office", "social services benefits office", "WIC office"],
  transportation: ["transit customer center", "medical transportation service"],
  utilities: ["utility bill assistance program", "community action agency"],
  other: ["community resource center", "free legal aid clinic"],
};

const BRING: Record<NeedCategory, string[]> = {
  food: ["Reusable bags if you have them", "Photo ID if you have one"],
  housing: ["Photo ID if you have one", "Medications in original bottles"],
  benefits: ["Photo ID", "Income information if available", "Mail with your address"],
  transportation: ["Photo ID if you have one", "Appointment date and address"],
  utilities: ["Most recent bill or shutoff notice", "Photo ID if you have one"],
  other: ["Any paperwork about your situation"],
};

interface Period {
  open?: { day: number; hour: number; minute: number };
  close?: { day: number; hour: number; minute: number };
}

function toHours(periods: Period[] | undefined): Hours[] {
  const week: Hours[] = Array.from({ length: 7 }, () => null);
  if (!periods) return week;
  for (const p of periods) {
    if (!p.open) continue;
    const day = p.open.day;
    if (day < 0 || day > 6) continue;
    const open = p.open.hour * 60 + p.open.minute;
    const close = p.close ? p.close.hour * 60 + p.close.minute : 24 * 60 - 1;
    week[day] = { open, close: close > open ? close : 24 * 60 - 1 };
  }
  return week;
}

async function searchCategory(
  category: NeedCategory,
  lat: number,
  lng: number,
  radiusMeters: number,
): Promise<Resource[]> {
  const out: Resource[] = [];
  for (const textQuery of QUERIES[category]) {
    const json = await placesSearchText({
      textQuery,
      pageSize: 8,
      locationBias: {
        circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters },
      },
    });
    for (const p of (json?.places ?? []) as any[]) {
      if (p.businessStatus && p.businessStatus !== "OPERATIONAL") continue;
      if (!p.location) continue;
      out.push({
        id: p.id as string,
        name: (p.displayName?.text as string) ?? "Community resource",
        category,
        subtitle: (p.primaryTypeDisplayName?.text as string) ?? textQuery,
        description:
          "Listed on Google Maps. Call ahead to confirm services, eligibility and today's hours.",
        address: (p.formattedAddress as string) ?? "",
        phone: (p.nationalPhoneNumber as string) ?? "Phone not listed",
        lat: p.location.latitude as number,
        lng: p.location.longitude as number,
        hours: toHours(p.regularOpeningHours?.periods),
        walkIns: true,
        idRequired: false,
        free: true,
        languages: ["English"],
        capacity: "accepting",
        bring: BRING[category],
        lastVerified: new Date().toISOString().slice(0, 10),
        unknownPolicies: true,
        ...(p.websiteUri ? { website: p.websiteUri as string } : {}),
      });
    }
  }
  const seen = new Set<string>();
  return out.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
}

export const findResources = createServerFn({ method: "POST" })
  .validator((d) =>
    z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        needs: z
          .array(
            z.enum(["food", "housing", "benefits", "transportation", "utilities", "other"]),
          )
          .min(1)
          .max(6),
        radiusMiles: z.number().min(0.2).max(25),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<Resource[]> => {
    const radiusMeters = Math.min(50000, Math.round(data.radiusMiles * 1609.34 * 1.4));
    const groups = await Promise.all(
      data.needs.map((n) => searchCategory(n as NeedCategory, data.lat, data.lng, radiusMeters)),
    );
    const seen = new Set<string>();
    return groups.flat().filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
  });
