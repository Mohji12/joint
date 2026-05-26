import { useEffect } from "react";

type ThreeDModelViewerProps = {
  /** Public URL or relative path to your .glb / .gltf file */
  src: string;
  /** Optional: alt text / short description of the model */
  alt?: string;
  /** Optional: custom className for sizing and layout */
  className?: string;
  /** Optional: remove default background for transparent display */
  transparent?: boolean;
  /** Optional: id for the model-viewer element (e.g. for orbit polling) */
  id?: string;
  /** When true: orbit (rotate) only — no pan or zoom; camera distance/angle locked */
  rotateOnly?: boolean;
  /**
   * Starting camera orbit: "theta phi radius" (e.g. "38deg 72deg 105%").
   * Auto-rotate and drag begin from this view when rotateOnly is set.
   */
  initialCameraOrbit?: string;
};

/**
 * Simple wrapper around the `<model-viewer>` web component so you can
 * drop a `.glb` 3D model into the site without extra React libraries.
 *
 * Usage:
 *
 *  <ThreeDModelViewer
 *    src="/models/your-model.glb"
 *    alt="My 3D building"
 *    className="w-full h-[400px]"
 *  />
 */
type ModelViewerElement = HTMLElement & {
  cameraOrbit?: string;
  minCameraOrbit?: string;
  maxCameraOrbit?: string;
  jumpCameraToGoal?: () => void;
};

/** Parse "theta phi radius" → locked min/max (horizontal spin only). */
function rotateOnlyOrbitBounds(initialOrbit: string): { min: string; max: string } {
  const parts = initialOrbit.trim().split(/\s+/);
  const phi = parts[1] ?? "72deg";
  const radius = parts[2] ?? "105%";
  const locked = `auto ${phi} ${radius}`;
  return { min: locked, max: locked };
}

const ThreeDModelViewer = ({
  src,
  alt,
  className,
  transparent,
  id,
  rotateOnly = false,
  initialCameraOrbit,
}: ThreeDModelViewerProps) => {
  const orbitBounds =
    rotateOnly && initialCameraOrbit ? rotateOnlyOrbitBounds(initialCameraOrbit) : null;

  // Dynamically load the model-viewer script once on the client
  useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="model-viewer.min.js"]',
    );
    if (existing) return;

    const script = document.createElement("script");
    script.type = "module";
    script.src =
      "https://unpkg.com/@google/model-viewer@latest/dist/model-viewer.min.js";
    document.head.appendChild(script);

    return () => {
      // We leave the script in place so subsequent mounts are instant.
    };
  }, []);

  // Apply starting view after the GLB loads so auto-rotate begins from that angle.
  useEffect(() => {
    if (!id || !initialCameraOrbit) return;

    const bounds = rotateOnly ? rotateOnlyOrbitBounds(initialCameraOrbit) : null;

    const applyInitialOrbit = () => {
      const el = document.getElementById(id) as ModelViewerElement | null;
      if (!el) return;
      el.cameraOrbit = initialCameraOrbit;
      if (bounds) {
        el.minCameraOrbit = bounds.min;
        el.maxCameraOrbit = bounds.max;
      }
      el.jumpCameraToGoal?.();
    };

    const el = document.getElementById(id) as ModelViewerElement | null;
    if (!el) return;

    el.addEventListener("load", applyInitialOrbit);
    applyInitialOrbit();

    return () => el.removeEventListener("load", applyInitialOrbit);
  }, [id, initialCameraOrbit, rotateOnly]);

  return (
    <model-viewer
      id={id}
      src={src}
      alt={alt}
      class={className}
      camera-controls
      auto-rotate
      {...(initialCameraOrbit && { "camera-orbit": initialCameraOrbit })}
      {...(rotateOnly && {
        "disable-pan": true,
        "disable-zoom": true,
        "min-camera-orbit": orbitBounds?.min ?? "auto 72deg 105%",
        "max-camera-orbit": orbitBounds?.max ?? "auto 72deg 105%",
        "interaction-prompt": "none",
      })}
      exposure="1"
      shadow-intensity="0.5"
      shadow-softness="1"
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        touchAction: rotateOnly ? "none" : undefined,
        ...(transparent && { backgroundColor: "transparent" }),
      }}
    />
  );
};

export default ThreeDModelViewer;

// Tell TypeScript about the <model-viewer> element so JSX doesn't error
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        alt?: string;
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
        "camera-orbit"?: string;
        "disable-pan"?: boolean;
        "disable-zoom"?: boolean;
        "min-camera-orbit"?: string;
        "max-camera-orbit"?: string;
        "interaction-prompt"?: "auto" | "none";
        exposure?: string;
        "shadow-intensity"?: string;
        "shadow-softness"?: string;
        class?: string;
      };
    }
  }
}

