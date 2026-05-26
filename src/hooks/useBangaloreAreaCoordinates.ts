import { useEffect, useState } from "react";
import {
  geocodeBangaloreArea,
  resolveBangaloreAreaCoords,
  type ResolvedAreaCoordinates,
} from "@/data/bangalore-area-coordinates";

/** Bangalore city center fallback. */
export const BANGALORE_CENTER: [number, number] = [12.9716, 77.5946];
export const BANGALORE_CITY_ZOOM = 11;
export const BANGALORE_AREA_ZOOM = 14;

export function useBangaloreAreaCoordinates(area?: string) {
  const [resolved, setResolved] = useState<ResolvedAreaCoordinates | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = area?.trim();
    if (!query) {
      setResolved(null);
      setLoading(false);
      return;
    }

    const sync = resolveBangaloreAreaCoords(query);
    if (sync) {
      setResolved(sync);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      const result = await geocodeBangaloreArea(query);
      if (!cancelled) {
        setResolved(result);
        setLoading(false);
      }
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [area]);

  const center: [number, number] = resolved
    ? [resolved.lat, resolved.lng]
    : BANGALORE_CENTER;

  const zoom = resolved ? BANGALORE_AREA_ZOOM : BANGALORE_CITY_ZOOM;

  return { resolved, center, zoom, loading };
}
