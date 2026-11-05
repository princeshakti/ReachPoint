import type { Resource } from "./types";

/** Plain-text version of the plan, for the "Text to patient" and "Email" buttons. */
export function buildShareText(resources: readonly Resource[], patientAddress: string): string {
  const lines = resources.map((resource, index) => {
    const parts = [resource.name, resource.address, resource.phone].filter(Boolean);
    return `${index + 1}. ${parts.join(" - ")}`;
  });

  return [
    "Your community resources (from your care team):",
    ...lines,
    `Near: ${patientAddress}`,
    "Please call before you go to confirm hours and what to bring.",
  ].join("\n");
}

export function directionsUrl(resource: Resource): string {
  const destination = encodeURIComponent(`${resource.name}, ${resource.address}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}
