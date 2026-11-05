export type NeedId = "food" | "housing" | "benefits" | "transportation" | "utilities" | "other";

export type TravelMode = "walking" | "transit" | "driving";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface PatientLocation extends LatLng {
  address: string;
}

/** A span of the day in minutes after midnight, for example 540–1020 is 9 AM to 5 PM. */
export interface TimeRange {
  open: number;
  close: number;
}

/** Opening hours for Sunday (index 0) through Saturday (index 6). An empty day means closed. */
export type WeekHours = TimeRange[][];

/** A community resource listing, as returned by Google Places. */
export interface Resource {
  id: string;
  name: string;
  need: NeedId;
  /** Google's description of the place, for example "Food bank". */
  kind: string;
  address: string;
  phone: string | null;
  website: string | null;
  lat: number;
  lng: number;
  /** `null` when Google has no opening hours for the place. */
  hours: WeekHours | null;
  /** ISO date (YYYY-MM-DD) the listing was pulled from Google. */
  retrievedOn: string;
}

/** What the care team entered on the search screen. */
export interface SearchCriteria {
  location: PatientLocation;
  needs: NeedId[];
  mode: TravelMode;
  maxMinutes: number;
  noId: boolean;
  spanish: boolean;
}

export type ApiFailureCode = "not_found" | "not_configured" | "quota" | "google_error";

/** Server functions return this instead of throwing, so the UI can show a precise message. */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; code: ApiFailureCode; message: string };
