import { Link } from "@tanstack/react-router";

/** Two rings and a dot: a person at the centre, with how far they can reach drawn around them. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="8" className="fill-reach" />
      <circle cx="16" cy="16" r="11" fill="none" strokeWidth="2" strokeDasharray="3 3" className="stroke-reach-tint" />
      <circle cx="16" cy="16" r="6.5" strokeWidth="2" fillOpacity="0.22" className="fill-white stroke-white" />
      <circle cx="16" cy="16" r="2.5" className="fill-white" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5 rounded-md text-xl font-bold tracking-tight text-ink">
      <LogoMark className="size-8" />
      ReachPoint
    </Link>
  );
}
