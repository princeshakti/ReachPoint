import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Hours, NeedCategory, PatientLocation, Resource } from "./reachpoint";

const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";

function credentials() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
  if (!lovableKey || !mapsKey) throw new Error("Google Maps is not connected for this project.");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": mapsKey,
    "Content-Type": "application/json",
  } as Record<string, string>;
}

async function gateway(path: string, init: RequestInit & { headers?: Record<string, string> }) {
  const res = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: { ...credentials(), ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Google Maps request failed [${res.status}]: ${body}`);
    throw new Error(`Google Maps request failed [${res.status}]: ${body}`);
  }
  return res.json() as Promise<any>;
}

/* ---------------- geocoding ---------------- */

export const geocodeAddress = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ address: z.string().min(3).max(200) }).parse(d))
  .handler(async ({ data }): Promise<PatientLocation> => {
    const json = await gateway(
      `/maps/api/geocode/json?address=${encodeURIComponent(data.address)}`,
      { method: "GET" },
    );
    const first = json?.results?.[0];
    if (!first) throw new Error("We couldn't find that address. Try adding the city or ZIP code.");
    return {
      address: first.formatted_address as string,
      lat: first.geometry.location.lat as number,
      lng: first.geometry.location.lng as number,
    };
  });

export const reverseGeocode = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).parse(d),
  )
  .handler(async ({ data }): Promise<PatientLocation> => {
    const json = await gateway(
      `/maps/api/geocode/json?latlng=${data.lat},${data.lng}`,
      { method: "GET" },
    );
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
    const json = await gateway("/places/v1/places:searchText", {
      method: "POST",
      headers: {
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.regularOpeningHours,places.primaryTypeDisplayName,places.websiteUri,places.businessStatus",
      },
      body: JSON.stringify({
        textQuery,
        pageSize: 8,
        locationBias: {
          circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters },
        },
      }),
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
  .inputValidator((d) =>
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
