/**
 * Server functions the browser can call. Each one validates its input,
 * talks to Google through `google.server.ts`, and returns a result object
 * rather than throwing, so the UI can show a precise message.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ApiResult, PatientLocation } from "@/lib/types";
import {
  browserKey,
  geocodeAddress as lookUpAddress,
  reverseGeocode as lookUpPoint,
  searchResources,
  toFailure,
  type ResourceSearch,
} from "./google.server";

const needSchema = z.enum(["food", "housing", "benefits", "transportation", "utilities", "other"]);

/** The key the browser needs to draw the map. Read at request time, so no rebuild is needed to change it. */
export const getMapsBrowserKey = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ key: string | null }> => ({ key: browserKey() }),
);

export const geocodeAddress = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ address: z.string().trim().min(3).max(200) }).parse(input))
  .handler(async ({ data }): Promise<ApiResult<PatientLocation>> => {
    try {
      const location = await lookUpAddress(data.address);
      if (!location) {
        return {
          ok: false,
          code: "not_found",
          message: "We couldn't find that address. Try adding the city or ZIP code.",
        };
      }
      return { ok: true, data: location };
    } catch (error) {
      return toFailure(error);
    }
  });

export const reverseGeocode = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).parse(input),
  )
  .handler(async ({ data }): Promise<ApiResult<PatientLocation>> => {
    try {
      const location = await lookUpPoint(data);
      if (!location) {
        return { ok: false, code: "not_found", message: "We couldn't turn that location into an address." };
      }
      return { ok: true, data: location };
    } catch (error) {
      return toFailure(error);
    }
  });

export const findResources = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        needs: z.array(needSchema).min(1).max(6),
        radiusMiles: z.number().min(0.5).max(25),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<ApiResult<ResourceSearch>> => {
    try {
      const search = await searchResources({ lat: data.lat, lng: data.lng }, data.needs, data.radiusMiles);
      return { ok: true, data: search };
    } catch (error) {
      return toFailure(error);
    }
  });
