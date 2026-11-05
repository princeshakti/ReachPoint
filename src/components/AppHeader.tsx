import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";

interface AppHeaderProps {
  children?: ReactNode;
  /** Keep the header at the top while scrolling. */
  sticky?: boolean;
  className?: string;
}

export function AppHeader({ children, sticky, className }: AppHeaderProps) {
  return (
    <header
      className={cn("no-print border-b border-line bg-page/90 backdrop-blur", sticky && "sticky top-0 z-20", className)}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3">
        <Logo />
        {children}
      </div>
    </header>
  );
}

/** Shared look for the small header buttons and links. */
export const headerButton =
  "inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-sm font-bold text-ink transition-colors hover:border-reach hover:text-reach-deep";

export const headerButtonPrimary =
  "inline-flex h-10 items-center gap-2 rounded-full bg-reach px-4 text-sm font-bold text-white transition-colors hover:bg-reach-deep";
