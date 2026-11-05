import { NeedPicker } from "@/components/NeedPicker";
import { ModePicker, TimePicker } from "@/components/TravelControls";
import type { SearchCriteria } from "@/lib/types";

interface RefinePanelProps {
  search: SearchCriteria;
  onChange: (patch: Partial<Omit<SearchCriteria, "location">>) => void;
}

/** Add needs or change how the patient travels without going back to the search screen. */
export function RefinePanel({ search, onChange }: RefinePanelProps) {
  return (
    <section
      className="space-y-5 rounded-panel border border-line bg-surface p-4 sm:p-5"
      aria-label="Refine the search"
    >
      <NeedPicker
        variant="chips"
        legend="Add or change what they need"
        selected={search.needs}
        onToggle={(id) => {
          const next = search.needs.includes(id) ? search.needs.filter((need) => need !== id) : [...search.needs, id];
          // Keep at least one need selected.
          if (next.length > 0) onChange({ needs: next });
        }}
      />
      <div className="flex flex-wrap gap-x-6 gap-y-4">
        <ModePicker
          legend="How they travel"
          name="refine-travel-mode"
          value={search.mode}
          onChange={(mode) => onChange({ mode })}
        />
        <TimePicker
          legend="Travel limit"
          name="refine-travel-time"
          value={search.maxMinutes}
          onChange={(maxMinutes) => onChange({ maxMinutes })}
        />
      </div>
    </section>
  );
}
