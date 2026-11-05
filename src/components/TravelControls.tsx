import { MODE_ICONS } from "@/components/icons";
import { Segmented } from "@/components/Segmented";
import { TIME_OPTIONS, TRAVEL_MODES } from "@/lib/travel";
import type { TravelMode } from "@/lib/types";

interface ModePickerProps {
  value: TravelMode;
  onChange: (mode: TravelMode) => void;
  legend?: string;
  hideLegend?: boolean;
  name?: string;
}

export function ModePicker({
  value,
  onChange,
  legend = "How do they get around?",
  hideLegend,
  name = "travel-mode",
}: ModePickerProps) {
  return (
    <Segmented
      legend={legend}
      {...(hideLegend ? { hideLegend } : {})}
      name={name}
      value={value}
      onChange={onChange}
      options={TRAVEL_MODES.map((mode) => {
        const Icon = MODE_ICONS[mode.id];
        return { value: mode.id, label: mode.label, icon: <Icon className="size-4 shrink-0" aria-hidden="true" /> };
      })}
    />
  );
}

interface TimePickerProps {
  value: number;
  onChange: (minutes: number) => void;
  legend?: string;
  name?: string;
}

export function TimePicker({
  value,
  onChange,
  legend = "How long can they travel?",
  name = "travel-time",
}: TimePickerProps) {
  return (
    <Segmented
      legend={legend}
      name={name}
      value={value}
      onChange={onChange}
      options={TIME_OPTIONS.map((minutes) => ({ value: minutes, label: `${minutes} min` }))}
    />
  );
}
