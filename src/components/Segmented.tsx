import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface SegmentedProps<T extends string | number> {
  legend: string;
  /** Keep the legend for screen readers only. */
  hideLegend?: boolean;
  name: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * A single-choice control built from native radio buttons, so keyboard
 * navigation (arrow keys) and screen readers work without extra code.
 */
export function Segmented<T extends string | number>({
  legend,
  hideLegend,
  name,
  options,
  value,
  onChange,
  className,
}: SegmentedProps<T>) {
  return (
    <fieldset className={className}>
      <legend className={cn("mb-2 text-sm font-bold", hideLegend && "sr-only")}>{legend}</legend>
      <div className="flex rounded-full border border-line-strong bg-surface p-1">
        {options.map((option) => (
          <label
            key={String(option.value)}
            className={cn(
              "flex h-10 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-2 text-sm font-bold transition-colors",
              "text-ink-soft hover:text-ink",
              "has-checked:bg-reach has-checked:text-white has-checked:hover:text-white",
              "has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-reach",
            )}
          >
            <input
              type="radio"
              name={name}
              value={String(option.value)}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.icon}
            <span className="truncate">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
