import { useEffect, useState } from "react";

/** The current time, refreshed every minute. `null` until the page is in the browser, to avoid server/client mismatches. */
export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return now;
}
