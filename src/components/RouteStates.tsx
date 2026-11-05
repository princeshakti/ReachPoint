import { Link, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { AppHeader } from "./AppHeader";

function StateLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-lg px-5 py-24 text-center">
        <TriangleAlert className="mx-auto size-10 text-amber-ink" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold">{title}</h1>
        {children}
      </main>
    </>
  );
}

const primaryAction =
  "inline-flex h-11 items-center rounded-full bg-reach px-5 text-sm font-bold text-white hover:bg-reach-deep";
const secondaryAction =
  "inline-flex h-11 items-center rounded-full border border-line-strong bg-surface px-5 text-sm font-bold hover:border-reach";

export function NotFound() {
  return (
    <StateLayout title="That page doesn't exist">
      <p className="mt-2 text-ink-soft">The link may be out of date. Start a new search from the home page.</p>
      <div className="mt-6 flex justify-center">
        <Link to="/" className={primaryAction}>
          Go to search
        </Link>
      </div>
    </StateLayout>
  );
}

export function ErrorFallback({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  console.error(error);

  return (
    <StateLayout title="This page didn't load">
      <p className="mt-2 text-ink-soft">Something went wrong. Try again, or go back to the search screen.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          className={primaryAction}
          onClick={() => {
            void router.invalidate();
            reset();
          }}
        >
          Try again
        </button>
        <Link to="/" className={secondaryAction}>
          Go to search
        </Link>
      </div>
    </StateLayout>
  );
}

export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <main className="mx-auto max-w-lg px-5 py-24 text-center text-sm font-bold text-ink-soft" aria-live="polite">
      {label}
    </main>
  );
}
