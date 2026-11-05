import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { AppHeader, headerButton } from "@/components/AppHeader";
import { PageLoading } from "@/components/RouteStates";
import { Handout } from "@/components/plan/Handout";
import { PlanEditor } from "@/components/plan/PlanEditor";
import { PlanToolbar } from "@/components/plan/PlanToolbar";
import { RoutePanel } from "@/components/plan/RoutePanel";
import { ModePicker } from "@/components/TravelControls";
import { useHydrated } from "@/hooks/useHydrated";
import { usePlan } from "@/hooks/usePlan";
import { useSearch } from "@/hooks/useSearch";

export const Route = createFileRoute("/plan")({
  component: PlanPage,
});

function PlanPage() {
  const hydrated = useHydrated();
  const { search, updateSearch } = useSearch();
  const { plan, move, remove, clear } = usePlan();
  const [showRoute, setShowRoute] = useState(false);

  if (!hydrated) return <PageLoading />;
  if (!search) return <Navigate to="/" />;

  return (
    <>
      <AppHeader>
        <Link to="/map" className={`${headerButton} no-print ml-auto`}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to results
        </Link>
      </AppHeader>

      <main className="mx-auto max-w-3xl space-y-6 px-5 py-8">
        <div className="no-print">
          <h1 className="text-2xl font-bold">Patient plan</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Near {search.location.address}. Change how the patient travels and the times below update.
          </p>
        </div>

        {plan.length === 0 ? (
          <div className="no-print rounded-panel border border-dashed border-line-strong bg-surface p-8 text-center">
            <p className="font-bold">No places in the plan yet</p>
            <p className="mt-1 text-sm text-ink-soft">
              Add places from the results, then come back to print or send them.
            </p>
            <Link to="/map" className={`${headerButton} mt-4`}>
              Go to results
            </Link>
          </div>
        ) : (
          <>
            <div className="no-print rounded-panel border border-line bg-surface p-5">
              <ModePicker
                legend="How does the patient travel?"
                name="plan-travel-mode"
                value={search.mode}
                onChange={(mode) => updateSearch({ mode })}
              />
            </div>

            <PlanToolbar
              plan={plan}
              patientAddress={search.location.address}
              showRoute={showRoute}
              onToggleRoute={() => setShowRoute((value) => !value)}
              onClear={clear}
            />

            {showRoute && <RoutePanel origin={search.location} plan={plan} mode={search.mode} />}

            <div className="no-print">
              <PlanEditor plan={plan} origin={search.location} mode={search.mode} onMove={move} onRemove={remove} />
            </div>

            <div>
              <h2 className="no-print mb-3 text-lg font-bold">Handout preview</h2>
              <Handout plan={plan} origin={search.location} mode={search.mode} />
            </div>
          </>
        )}
      </main>
    </>
  );
}
