import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import heroGlobeModel from "@/assets/isometric+city+globe+3d+model.glb";
import ThreeDModelViewer from "./ThreeDModelViewer";

const MODEL_VIEWER_ID = "hero-3d-globe";

/** Front-right elevated view — rotation (auto + drag) starts from this angle */
const HERO_GLOBE_INITIAL_ORBIT = "38deg 72deg 105%";

const CONTENT_BY_CATEGORY = {
  residential: {
    heading: "Residential",
    content:
      "Residential construction focuses on developing low rise structures like villas and duplexes that are designed for both everyday living and wealth creation.",
  },
  commercial: {
    heading: "Commercial",
    content:
      "Commercial construction focuses on creating high capacity spaces like office hubs, hotels, and specialized rental complexes that serve businesses and communities.",
  },
  industrial: {
    heading: "Industrial",
    content:
      "In industrial construction, each structure is engineered as a high performance power shell that protects massive machinery and supports extreme operating conditions.",
  },
  interior: {
    heading: "Interior Architecture",
    content:
      "Interior Architecture is the strategic process of turning a building's internal volume into a space that is both operationally efficient and visually refined.",
  },
} as const;

type Category = keyof typeof CONTENT_BY_CATEGORY;

const CONTENT_PAIRS: [Category, Category][] = [
  ["residential", "commercial"],
  ["industrial", "interior"],
];

/**
 * Hero section   nature-inspired, luminous, organic elegance:
 * - JOINTLY in light green (#88C4A1) with subtle translucency
 * - Soft ethereal background with pale green tints
 * - Blurred foliage shapes, greenish globe reflection
 * - Rotating content blocks left & right of globe (every 5 sec)
 */
const HeroSection = () => {
  const [pairIndex, setPairIndex] = useState(0);
  const [left, right] = CONTENT_PAIRS[pairIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setPairIndex((prev) => (prev + 1) % CONTENT_PAIRS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen bg-background flex flex-col items-center justify-between overflow-hidden pt-20 pb-2 sm:pt-24 sm:pb-4 md:pt-28 md:pb-6">
      {/* Background from theme tokens */}
      <div className="absolute inset-0 bg-background dark:bg-[#111827]" />

      {/* Keep hero background uniform across left/right */}

      {/* Floor reflection */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[50%] pointer-events-none"
        style={{
          background: `linear-gradient(to top, hsl(var(--background) / 0.6), hsl(var(--background) / 0.25), transparent)`,
        }}
      />

      {/* Blurred accent glow   left side */}
      <div
        className="absolute left-0 top-1/4 w-40 h-80 opacity-[0.15] pointer-events-none hidden lg:block"
        style={{
          background: `radial-gradient(ellipse at center, #F3B24A, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />

      {/* Blurred accent glow   right side */}
      <div
        className="absolute right-0 top-1/3 w-32 h-72 opacity-[0.12] pointer-events-none hidden lg:block"
        style={{
          background: `radial-gradient(ellipse at center, #F3B24A, transparent 70%)`,
          filter: "blur(50px)",
        }}
      />

      {/* Main content - centered layout */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 text-center">
        {/* JOINTLY   scale down on mobile for better fit */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="font-times text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl 2xl:text-[10rem] font-normal tracking-[0.06em] sm:tracking-[0.08em] md:tracking-[0.12em] leading-[0.88] mb-1 select-none antialiased origin-center"
          style={{
            color: "rgba(31, 47, 70, 0.9)",
            textShadow: "0 1px 2px rgba(0,0,0,0.03)",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
            transform: "scaleY(1.35)",
          }}
        >
          JOINTLLY
        </motion.h1>

        {/* Tagline   tighter gap, Westack, cohesive with hero */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="font-westack text-base sm:text-lg md:text-xl text-center leading-relaxed max-w-2xl mx-auto mb-8 md:mb-10 px-4"
          style={{ color: "#5a6b5f" }}
        >
          Jointlly is a neutral decision-enablement and discovery platform that acts as a trust layer for the construction industry
        </motion.p>

        {/* Row: Left content | Globe | Right content */}
        <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-6 xl:gap-10">
          {/* Left content block */}
          <div className="hidden lg:flex w-full lg:max-w-[280px] xl:max-w-[320px] flex-col items-end text-right min-h-[120px] justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={left}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="space-y-2"
              >
                <h3 className="font-westack text-lg xl:text-xl font-medium" style={{ color: "#1F2F46" }}>
                  {CONTENT_BY_CATEGORY[left].heading}
                </h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed" style={{ color: "#5a6b5f" }}>
                  {CONTENT_BY_CATEGORY[left].content}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 3D Globe container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="w-full max-w-[340px] sm:max-w-[400px] md:max-w-[440px] lg:max-w-[400px] xl:max-w-[460px] aspect-square flex-shrink-0"
          >
            <div className="hero-globe w-full h-full rounded-full overflow-hidden">
              <ThreeDModelViewer
                id={MODEL_VIEWER_ID}
                src={heroGlobeModel}
                alt="3D globe"
                className="w-full h-full"
                transparent
                rotateOnly
                initialCameraOrbit={HERO_GLOBE_INITIAL_ORBIT}
              />
            </div>
          </motion.div>

          {/* Right content block */}
          <div className="hidden lg:flex w-full lg:max-w-[280px] xl:max-w-[320px] flex-col items-start text-left min-h-[120px] justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={right}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="space-y-2"
              >
                <h3 className="font-westack text-lg xl:text-xl font-medium" style={{ color: "#1F2F46" }}>
                  {CONTENT_BY_CATEGORY[right].heading}
                </h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed" style={{ color: "#5a6b5f" }}>
                  {CONTENT_BY_CATEGORY[right].content}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile: show content below globe, single item at a time */}
        <div className="lg:hidden w-full max-w-md px-2 sm:px-4 mt-4 sm:mt-6 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={left}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="space-y-2"
            >
              <h3 className="font-westack text-lg font-medium" style={{ color: "#1F2F46" }}>
                {CONTENT_BY_CATEGORY[left].heading}
              </h3>
              <p className="font-sans text-sm leading-relaxed" style={{ color: "#5a6b5f" }}>
                {CONTENT_BY_CATEGORY[left].content}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;

