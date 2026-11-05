import { Mail, MessageSquare, Printer, Route, Trash2 } from "lucide-react";
import { headerButton, headerButtonPrimary } from "@/components/AppHeader";
import { cn } from "@/lib/cn";
import { buildShareText } from "@/lib/share";
import type { Resource } from "@/lib/types";

interface PlanToolbarProps {
  plan: readonly Resource[];
  patientAddress: string;
  showRoute: boolean;
  onToggleRoute: () => void;
  onClear: () => void;
}

export function PlanToolbar({ plan, patientAddress, showRoute, onToggleRoute, onClear }: PlanToolbarProps) {
  const text = encodeURIComponent(buildShareText(plan, patientAddress));
  const subject = encodeURIComponent("Community resources from your care team");

  return (
    <div className="no-print flex flex-wrap gap-2">
      <button type="button" className={headerButtonPrimary} onClick={() => window.print()}>
        <Printer className="size-4" aria-hidden="true" />
        Print handout
      </button>
      <a className={headerButton} href={`sms:?&body=${text}`}>
        <MessageSquare className="size-4" aria-hidden="true" />
        Text to patient
      </a>
      <a className={headerButton} href={`mailto:?subject=${subject}&body=${text}`}>
        <Mail className="size-4" aria-hidden="true" />
        Email
      </a>
      <button
        type="button"
        className={cn(headerButton, showRoute && "border-reach bg-reach-tint text-reach-deep")}
        aria-pressed={showRoute}
        onClick={onToggleRoute}
      >
        <Route className="size-4" aria-hidden="true" />
        Route builder
      </button>
      <button type="button" className={cn(headerButton, "ml-auto")} onClick={onClear}>
        <Trash2 className="size-4" aria-hidden="true" />
        Clear plan
      </button>
    </div>
  );
}
