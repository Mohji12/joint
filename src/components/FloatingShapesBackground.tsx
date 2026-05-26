import { useId, useState, useEffect } from "react";

const FILL = "hsl(160 45% 75% / 0.45)";
const STROKE = "hsl(160 50% 70% / 0.35)";

const shapes = [
  // House (roof + body)   top left area
  {
    type: "house",
    left: "8%",
    top: "12%",
    size: 48,
    duration: "18s",
    delay: "0s",
  },
  // Building / tower
  {
    type: "building",
    left: "88%",
    top: "18%",
    size: 56,
    duration: "22s",
    delay: "2s",
  },
  // Roof only
  {
    type: "roof",
    left: "15%",
    top: "65%",
    size: 40,
    duration: "20s",
    delay: "1s",
  },
  // Window
  {
    type: "window",
    left: "82%",
    top: "55%",
    size: 32,
    duration: "16s",
    delay: "0.5s",
  },
  // Small house
  {
    type: "house",
    left: "72%",
    top: "78%",
    size: 36,
    duration: "24s",
    delay: "3s",
  },
  // Building
  {
    type: "building",
    left: "5%",
    top: "42%",
    size: 44,
    duration: "19s",
    delay: "1.5s",
  },
  // Roof
  {
    type: "roof",
    left: "92%",
    top: "42%",
    size: 28,
    duration: "21s",
    delay: "0s",
  },
  // Window
  {
    type: "window",
    left: "45%",
    top: "8%",
    size: 24,
    duration: "17s",
    delay: "2.5s",
  },
  // House
  {
    type: "house",
    left: "52%",
    top: "72%",
    size: 40,
    duration: "23s",
    delay: "1s",
  },
  // Building
  {
    type: "building",
    left: "28%",
    top: "22%",
    size: 36,
    duration: "20s",
    delay: "0.8s",
  },
  // Window
  {
    type: "window",
    left: "65%",
    top: "35%",
    size: 20,
    duration: "15s",
    delay: "1.2s",
  },
  // Roof
  {
    type: "roof",
    left: "38%",
    top: "85%",
    size: 32,
    duration: "25s",
    delay: "0s",
  },
];

function HouseIcon({ size, fill, stroke }: { size: number; fill: string; stroke: string }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.2">
      <path d="M12 3L3 10v11h6v-6h6v6h6V10L12 3z" fill={fill} strokeLinejoin="round" />
    </svg>
  );
}

function BuildingIcon({ size, fill, stroke }: { size: number; fill: string; stroke: string }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.2">
      <rect x="4" y="2" width="16" height="20" rx="1" fill={fill} strokeLinejoin="round" />
      <line x1="9" y1="8" x2="9" y2="14" />
      <line x1="15" y1="8" x2="15" y2="14" />
      <line x1="9" y1="16" x2="9" y2="20" />
      <line x1="15" y1="16" x2="15" y2="20" />
    </svg>
  );
}

function RoofIcon({ size, fill, stroke }: { size: number; fill: string; stroke: string }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.2">
      <path d="M12 2L2 12h4v10h12V12h4L12 2z" fill={fill} strokeLinejoin="round" />
    </svg>
  );
}

function WindowIcon({ size, fill, stroke }: { size: number; fill: string; stroke: string }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.2">
      <rect x="3" y="3" width="18" height="18" rx="2" fill={fill} strokeLinejoin="round" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  );
}

const FADE_SCROLL_PX = 500; // Start fading after this many px scroll; fully gone by ~2x

const FloatingShapesBackground = () => {
  const id = useId();
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y <= 0) {
        setOpacity(1);
      } else if (y >= FADE_SCROLL_PX * 2) {
        setOpacity(0);
      } else {
        setOpacity(1 - y / (FADE_SCROLL_PX * 2));
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-[20] overflow-hidden transition-opacity duration-300"
      style={{ isolation: "isolate", opacity }}
    >
      {shapes.map((shape, i) => (
          <div
            key={`${id}-${i}`}
            className="absolute"
            style={{
              left: shape.left,
              top: shape.top,
              width: shape.size,
              height: shape.size,
              animation: i % 2 === 0 ? "float-shape ease-in-out infinite" : "float-shape-slow ease-in-out infinite",
              animationDuration: shape.duration,
              animationDelay: shape.delay,
            }}
          >
            {shape.type === "house" && <HouseIcon size={shape.size} fill={FILL} stroke={STROKE} />}
            {shape.type === "building" && <BuildingIcon size={shape.size} fill={FILL} stroke={STROKE} />}
            {shape.type === "roof" && <RoofIcon size={shape.size} fill={FILL} stroke={STROKE} />}
            {shape.type === "window" && <WindowIcon size={shape.size} fill={FILL} stroke={STROKE} />}
          </div>
        )
      )}
    </div>
  );
};

export default FloatingShapesBackground;
