import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { SearchForm } from "@/components/search/SearchForm";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <AppHeader>
        <p className="ml-auto hidden items-center gap-1.5 text-sm font-bold text-ink-soft sm:flex">
          <ShieldCheck className="size-4 text-reach" aria-hidden="true" />
          Nothing about the patient is saved
        </p>
      </AppHeader>

      <main className="mx-auto max-w-7xl px-5 pb-16">
        <section className="mx-auto max-w-3xl py-10 text-center sm:py-14">
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            Find help the patient can actually reach.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-soft">
            Tell us where they are, what they need and how they get around. ReachPoint shows nearby food, shelter,
            benefits and more, ranked by travel time.
          </p>
        </section>

        <SearchForm />

        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-ink-soft">
          Listings come from Google Maps and travel times are estimates. Always call a place to confirm hours and
          eligibility before sending a patient there.
        </p>
      </main>
    </>
  );
}
