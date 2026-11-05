import { cn } from "@/lib/cn";
import type { OpenStatus } from "@/lib/hours";

/** Open / closed / unknown, with a dot as well as colour so it doesn't rely on colour alone. */
export function StatusBadge({ status }: { status: OpenStatus }) {
  const tone =
    status.state === "open" && !status.closingSoon
      ? "bg-ok-tint text-ok"
      : status.state === "open" || status.state === "unknown"
        ? "bg-amber-tint text-amber-ink"
        : "bg-line/60 text-ink-soft";

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold", tone)}>
      <span
        className={cn("size-2 rounded-full", status.state === "closed" ? "border border-current" : "bg-current")}
        aria-hidden="true"
      />
      {status.label}
    </span>
  );
}
