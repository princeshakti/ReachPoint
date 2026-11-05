import type { NeedId } from "./types";

export interface NeedMeta {
  id: NeedId;
  label: string;
  hint: string;
}

export const NEEDS: readonly NeedMeta[] = [
  { id: "food", label: "Food", hint: "Pantries and free meals" },
  { id: "housing", label: "Housing and shelter", hint: "Shelters and rental help" },
  { id: "benefits", label: "Benefits", hint: "EBT, CalFresh and WIC" },
  { id: "transportation", label: "Transportation", hint: "Rides and transit help" },
  { id: "utilities", label: "Utilities", hint: "Help with bills" },
  { id: "other", label: "Other", hint: "Legal aid and community centers" },
];

export function needLabel(id: NeedId): string {
  return NEEDS.find((need) => need.id === id)?.label ?? "Other";
}
