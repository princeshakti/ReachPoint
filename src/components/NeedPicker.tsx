import { Check } from "lucide-react";
import { NEEDS } from "@/lib/needs";
import { cn } from "@/lib/cn";
import type { NeedId } from "@/lib/types";
import { NEED_ICONS } from "./icons";

interface NeedPickerProps {
  selected: readonly NeedId[];
  onToggle: (id: NeedId) => void;
  legend?: string;
  /** `tiles` for the main search form, `chips` for the compact refine panel. */
  variant?: "tiles" | "chips";
}

const focusRing = "has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-reach";

export function NeedPicker({ selected, onToggle, legend = "What do they need?", variant = "tiles" }: NeedPickerProps) {
  const chips = variant === "chips";

  return (
    <fieldset>
      <legend className={chips ? "mb-2 text-sm font-bold" : "sr-only"}>{legend}</legend>
      <div className={chips ? "flex flex-wrap gap-2" : "grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-3"}>
        {NEEDS.map((need) => {
          const Icon = NEED_ICONS[need.id];
          return (
            <label
              key={need.id}
              className={cn(
                "group cursor-pointer border bg-surface transition-colors",
                "border-line-strong hover:border-reach has-checked:border-reach has-checked:bg-reach-wash",
                focusRing,
                chips
                  ? "inline-flex items-center gap-2 rounded-full py-1.5 pr-3.5 pl-3 text-sm font-bold"
                  : "flex items-start gap-3 rounded-tile p-3.5",
              )}
            >
              <input
                type="checkbox"
                checked={selected.includes(need.id)}
                onChange={() => onToggle(need.id)}
                className="sr-only"
              />
              <span
                className={cn(
                  "grid shrink-0 place-items-center bg-reach-tint text-reach-deep",
                  chips ? "size-5 rounded-full" : "size-10 rounded-lg",
                )}
              >
                <Icon className={chips ? "size-3" : "size-5"} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block font-bold", !chips && "leading-tight")}>{need.label}</span>
                {!chips && <span className="mt-0.5 block text-sm text-ink-soft">{need.hint}</span>}
              </span>
              {!chips && (
                <Check
                  className="mt-0.5 size-5 shrink-0 text-reach opacity-0 transition-opacity group-has-checked:opacity-100"
                  aria-hidden="true"
                />
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
