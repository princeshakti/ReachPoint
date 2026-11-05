import { Apple, Bus, Car, CreditCard, Footprints, House, Lightbulb, LifeBuoy, type LucideIcon } from "lucide-react";
import type { NeedId, TravelMode } from "@/lib/types";

export const NEED_ICONS: Record<NeedId, LucideIcon> = {
  food: Apple,
  housing: House,
  benefits: CreditCard,
  transportation: Bus,
  utilities: Lightbulb,
  other: LifeBuoy,
};

export const MODE_ICONS: Record<TravelMode, LucideIcon> = {
  walking: Footprints,
  transit: Bus,
  driving: Car,
};
