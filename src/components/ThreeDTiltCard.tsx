import { ReactNode, useEffect, useMemo, useRef } from "react";

type ThreeDTiltCardProps = {
  children: ReactNode;
  className?: string;
  /**
   * Tailwind gradient classes applied to the glow layer, e.g. `from-primary/30 to-accent/30`.
   * Keep it limited to colors that exist in your Tailwind config.
   */
  glowGradientClassName?: string;
  maxTiltDeg?: number;
  scaleOnHover?: number;
  /**
   * Disable the tilt effect (layout-only).
   * Defaults to false.
   */
  disabled?: boolean;
};

const ThreeDTiltCard = ({
  children,
  className = "",
  glowGradientClassName = "from-primary/30 to-accent/30",
  maxTiltDeg = 10,
  scaleOnHover = 1.015,
  disabled = false,
}: ThreeDTiltCardProps) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{ rx: number; ry: number; px: number; py: number } | null>(null);

  // Prefer user accessibility settings and avoid tilt on touch devices.
  const tiltEnabled = useMemo(() => {
    if (disabled) return false;
    if (typeof window === "undefined") return false;
    const reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const noHover = window.matchMedia && window.matchMedia("(hover: none)").matches;
    return !reduceMotion && !noHover;
  }, [disabled]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    if (!tiltEnabled) return;

    const setStyle = (rx: number, ry: number, px: number, py: number) => {
      // Apply via inline style to avoid rerendering on every pointer move.
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scaleOnHover})`;
      el.style.setProperty("--gloss-x", `${px}%`);
      el.style.setProperty("--gloss-y", `${py}%`);
    };

    const onPointerMove = (e: PointerEvent) => {
      const elNow = cardRef.current;
      if (!elNow || !tiltEnabled) return;

      const rect = elNow.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const px = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const py = Math.max(0, Math.min(100, (y / rect.height) * 100));

      // Convert to [-0.5..0.5] then degrees.
      const nx = px / 100 - 0.5;
      const ny = py / 100 - 0.5;
      const ry = nx * (maxTiltDeg * 2);
      const rx = -ny * (maxTiltDeg * 2);

      pendingRef.current = { rx, ry, px, py };
      if (rafRef.current != null) return;

      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const pending = pendingRef.current;
        if (!pending) return;
        setStyle(pending.rx, pending.ry, pending.px, pending.py);
      });
    };

    const onPointerLeave = () => {
      const elNow = cardRef.current;
      if (!elNow) return;
      pendingRef.current = null;
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      elNow.style.transform = "none";
      elNow.style.setProperty("--gloss-x", "50%");
      elNow.style.setProperty("--gloss-y", "20%");
    };

    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerleave", onPointerLeave);

    return () => {
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [maxTiltDeg, scaleOnHover, tiltEnabled]);

  return (
    <div
      ref={cardRef}
      className={`relative group will-change-transform transition-transform duration-200 ${className}`}
      style={
        {
          "--gloss-x": "50%",
          "--gloss-y": "20%",
        } as React.CSSProperties
      }
    >
      {/* Glow */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -inset-[1px] rounded-[inherit] blur-3xl opacity-25 bg-gradient-to-br ${glowGradientClassName}`}
      />

      {/* Gloss highlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(500px_circle_at_var(--gloss-x)_var(--gloss-y),rgba(255,255,255,0.32),transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      />

      {/* Content */}
      <div className="relative">{children}</div>
    </div>
  );
};

export default ThreeDTiltCard;

