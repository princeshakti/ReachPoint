import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface FlagOptionsProps {
  noId: boolean;
  spanish: boolean;
  onChange: (flag: "noId" | "spanish", value: boolean) => void;
}

const FLAGS = [
  {
    key: "noId" as const,
    label: "Patient has no ID",
    hint: "Each result will remind you to ask whether ID is required.",
  },
  {
    key: "spanish" as const,
    label: "Patient prefers Spanish",
    hint: "Each result will remind you to ask about Spanish-speaking staff.",
  },
];

export function FlagOptions({ noId, spanish, onChange }: FlagOptionsProps) {
  const values = { noId, spanish };

  return (
    <fieldset>
      <legend className="sr-only">Things to flag</legend>
      <div className="grid gap-3 min-[560px]:grid-cols-2">
        {FLAGS.map((flag) => (
          <label
            key={flag.key}
            className={cn(
              "group flex cursor-pointer items-start gap-3 rounded-tile border border-line-strong bg-surface p-3.5 transition-colors",
              "hover:border-reach has-checked:border-reach has-checked:bg-reach-wash",
              "has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-reach",
            )}
          >
            <input
              type="checkbox"
              checked={values[flag.key]}
              onChange={(event) => onChange(flag.key, event.target.checked)}
              className="sr-only"
            />
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded border border-line-strong bg-surface group-has-checked:border-reach group-has-checked:bg-reach">
              <Check className="size-3.5 text-white opacity-0 group-has-checked:opacity-100" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-bold leading-tight">{flag.label}</span>
              <span className="mt-0.5 block text-sm text-ink-soft">{flag.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
