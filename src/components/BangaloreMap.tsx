import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";
import { useMapColorScheme } from "@/hooks/useMapColorScheme";
import {
  BANGALORE_AREA_ZOOM,
  BANGALORE_CENTER,
  BANGALORE_CITY_ZOOM,
  useBangaloreAreaCoordinates,
} from "@/hooks/useBangaloreAreaCoordinates";
import { facingToBearing, MAP_TILES } from "@/lib/mapUtils";

const BANGALORE_BOUNDS: L.LatLngBoundsExpression = [
  [12.8342, 77.4577],
  [13.112, 77.7522],
];

function MapViewController({
  center,
  zoom,
  hasArea,
}: {
  center: [number, number];
  zoom: number;
  hasArea: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (hasArea) {
      map.flyTo(center, zoom, { duration: 0.75 });
    } else {
      map.fitBounds(BANGALORE_BOUNDS, { padding: [24, 24], maxZoom: 14 });
    }
  }, [map, center[0], center[1], zoom, hasArea]);
  return null;
}

function createFacingIcon(bearing: number, isDark: boolean) {
  const fill = isDark ? "#F3B24A" : "#1A5C35";
  const stroke = isDark ? "#ffffff" : "#1a2e22";
  return L.divIcon({
    className: "bangalore-facing-marker",
    html: `
      <div class="bangalore-facing-marker__inner" style="transform: rotate(${bearing}deg)">
        <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
          <circle cx="22" cy="22" r="20" fill="${isDark ? "rgba(15,23,42,0.88)" : "rgba(255,255,255,0.92)"}" stroke="${stroke}" stroke-width="1.5"/>
          <path d="M22 8 L28 30 L22 26 L16 30 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.2" stroke-linejoin="round"/>
        </svg>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

function createAreaPinIcon(isDark: boolean) {
  const color = isDark ? "#F3B24A" : "#1A5C35";
  return L.divIcon({
    className: "bangalore-area-pin",
    html: `<div class="bangalore-area-pin__dot" style="background:${color};box-shadow:0 0 0 3px ${isDark ? "rgba(243,178,74,0.25)" : "rgba(26,92,53,0.2)"}"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function NorthCompass({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute top-3 right-3 z-[1000] flex h-11 w-11 items-center justify-center rounded-full border shadow-md",
        isDark ? "border-white/20 bg-slate-900/90 text-amber-300" : "border-border bg-background/95 text-emerald-900",
      )}
      aria-label="Map north direction"
    >
      <div className="flex flex-col items-center leading-none">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path d="M9 2 L11.5 11 L9 9 L6.5 11 Z" fill="currentColor" />
        </svg>
        <span className="mt-0.5 text-[9px] font-bold tracking-wide">N</span>
      </div>
    </div>
  );
}

export interface BangaloreMapProps {
  className?: string;
  height?: number | string;
  /** Selected Bangalore area / locality (e.g. HSR Layout). Centers map & marker here. */
  area?: string;
  /** Property facing — rotates direction arrow on map (e.g. North, South-East). */
  facing?: string;
}

export function BangaloreMap({ className, height = 320, area, facing }: BangaloreMapProps) {
  const [mounted, setMounted] = useState(false);
  const colorScheme = useMapColorScheme();
  const isDark = colorScheme === "dark";
  const tiles = MAP_TILES[colorScheme];
  const bearing = useMemo(() => facingToBearing(facing), [facing]);
  const { resolved, center, zoom, loading } = useBangaloreAreaCoordinates(area);
  const hasArea = Boolean(resolved);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-muted/30 flex items-center justify-center text-muted-foreground text-sm",
          className,
        )}
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      >
        Loading map…
      </div>
    );
  }

  const initialCenter = hasArea ? center : BANGALORE_CENTER;
  const initialZoom = hasArea ? BANGALORE_AREA_ZOOM : BANGALORE_CITY_ZOOM;

  return (
    <div
      className={cn("relative rounded-lg border border-border overflow-hidden", className)}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    >
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        scrollWheelZoom
        className={cn("h-full w-full", isDark && "bangalore-map--dark")}
        style={{ minHeight: typeof height === "number" ? `${height}px` : height }}
      >
        <TileLayer key={colorScheme} attribution={tiles.attribution} url={tiles.url} />
        <MapViewController center={center} zoom={zoom} hasArea={hasArea} />

        {hasArea && bearing == null ? (
          <Marker
            key={`pin-${center[0]}-${center[1]}-${colorScheme}`}
            position={center}
            icon={createAreaPinIcon(isDark)}
          />
        ) : null}

        {hasArea && bearing != null ? (
          <Marker
            key={`facing-${bearing}-${center[0]}-${center[1]}-${colorScheme}`}
            position={center}
            icon={createFacingIcon(bearing, isDark)}
          />
        ) : null}
      </MapContainer>

      <NorthCompass isDark={isDark} />

      {area?.trim() ? (
        <div
          className={cn(
            "pointer-events-none absolute bottom-3 left-3 z-[1000] max-w-[min(100%,16rem)] rounded-md px-2.5 py-1.5 text-xs font-medium shadow-md border",
            isDark
              ? "border-white/15 bg-slate-900/90 text-amber-100"
              : "border-border bg-background/95 text-foreground",
          )}
        >
          {loading && !resolved ? (
            <span>Locating {area}…</span>
          ) : (
            <>
              Area:{" "}
              <span className="font-semibold">{resolved?.matchedName ?? area}</span>
              {facing?.trim() ? (
                <>
                  {" "}
                  · Facing: <span className="font-semibold">{facing}</span>
                </>
              ) : null}
            </>
          )}
        </div>
      ) : facing?.trim() ? (
        <div
          className={cn(
            "pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-md px-2.5 py-1.5 text-xs font-medium shadow-md border",
            isDark
              ? "border-white/15 bg-slate-900/90 text-amber-100"
              : "border-border bg-background/95 text-foreground",
          )}
        >
          Property facing: <span className="font-semibold">{facing}</span>
        </div>
      ) : null}
    </div>
  );
}
