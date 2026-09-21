let promise: Promise<typeof google.maps> | null = null;

const CALLBACK = "__reachpointMapsReady";

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (promise) return promise;

  const key = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"] as
    | string
    | undefined;
  const channel = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] as
    | string
    | undefined;

  if (!key) return Promise.reject(new Error("Missing Google Maps browser key"));

  promise = new Promise<typeof google.maps>((resolve, reject) => {
    (window as unknown as Record<string, unknown>)[CALLBACK] = () => resolve(google.maps);
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key,
      loading: "async",
      callback: CALLBACK,
      v: "weekly",
    });
    if (channel) params.set("channel", channel);
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return promise;
}

