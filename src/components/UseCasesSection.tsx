import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import residentialImage from "@/assets/Whisk_a135ddc32c118f79e3d48919eebd2e60dr.png";
import commercialImage from "@/assets/Whisk_aa9a318247185209de14cb316c79dfb7dr.png";
import industrialImage from "@/assets/Whisk_2ea788f2abc7f0d9921482f04b888b05dr.png";
import interiorImage from "@/assets/Whisk_c308816b1f9ae84b40d45d8f627acc50dr.png";
import ThreeDTiltCard from "./ThreeDTiltCard";
import { getUseCaseTheme, type UseCaseId } from "./cardThemes";

const useCases = [
  {
    id: "residential",
    title: "Residential Project",
    subtitle: "Duplex House",
    image: residentialImage,
    icon: "🏠",
    position: "top-left" as const,
    tag: "Residential Construction",
    highlight: "Residential",
    rest: "construction done right",
    strapline: "Residential construction focuses on developing low rise structures like villas and duplexes that are designed for both everyday living and wealth creation.",
    body: "Residential construction focuses on developing low rise structures like villas and duplexes that are designed for both everyday living and wealth creation.",
    bullets: [
      "The Structure: Privately owned 2 3 storey structures like duplexes, villas, or low rise apartments where owners can live or rent.",
      "Examples: A duplex with separate units for rental income or a villa designed for family living with private gardens, strategically planned to maximize land utility.",
    ],
  },
  {
    id: "commercial",
    title: "Commercial Project",
    subtitle: "Multi-storey Office",
    image: commercialImage,
    icon: "🏢",
    position: "top-right" as const,
    tag: "Commercial Construction",
    highlight: "Commercial",
    rest: "spaces that scale",
    strapline: "Commercial construction focuses on creating high capacity spaces like office hubs, hotels, and specialized rental complexes that serve businesses and communities.",
    body: "Commercial construction focuses on creating high capacity spaces like office hubs, hotels, and specialized rental complexes that serve businesses and communities.",
    bullets: [
      "The Structure: Expertly engineered non residential structures, typically larger and built to stricter regulations than residential projects.",
      "Examples: Multi storey hotels, corporate office towers, school campuses, or PG buildings projects that maximize functional utility while meeting the highest safety and government standards.",
    ],
  },
  {
    id: "industrial",
    title: "Industrial Project",
    subtitle: "Modern Factory",
    image: industrialImage,
    icon: "🏭",
    position: "bottom-left" as const,
    tag: "Industrial Construction",
    highlight: "Industrial",
    rest: "power shells for scale",
    strapline: "In industrial construction, each structure is engineered as a high performance power shell that protects massive machinery and supports extreme operating conditions.",
    body: "In industrial construction, each structure is engineered as a high performance power shell that protects massive machinery and supports extreme operating conditions.",
    bullets: [
      "The Structure: Reinforced foundations and massive steel frames built for high volume operations rather than appearance.",
      "Utility: Safely houses heavy machinery and handles the intense physical demands of large scale production and logistics.",
    ],
  },
  {
    id: "interior",
    title: "Interior Design",
    subtitle: "Luxury Residential",
    image: interiorImage,
    icon: "✨",
    position: "bottom-right" as const,
    tag: "Interior Architecture / Designer",
    highlight: "Interior",
    rest: "architecture with intent",
    strapline: "Interior Architecture is the strategic process of turning a building's internal volume into a space that is both operationally efficient and visually refined.",
    body: "Interior Architecture is the strategic process of turning a building's internal volume into a space that is both operationally efficient and visually refined.",
    bullets: [
      "The Discipline: Blends structural knowledge with modern aesthetics so internal spaces function as smoothly as they look.",
      "Focus: Optimizes spatial flow, material selection, and detailing to create interiors that balance usability with design.",
    ],
  },
];

const UseCaseCard = ({
  useCase,
  index,
}: {
  useCase: (typeof useCases)[0];
  index: number;
}) => {
  const id = useCase.id as UseCaseId;
  const theme = getUseCaseTheme(id);

  const header = (() => {
    if (theme.headerVariant === "topBar") {
      return (
        <>
          <div className={`absolute left-0 top-0 h-2 w-full ${theme.accentGradientClassName}`} />
          <div className="absolute left-3 top-3">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-background/70 backdrop-blur border border-border/60">
              <span className="text-lg leading-none">{useCase.icon}</span>
              <span className="text-xs font-semibold text-foreground">{useCase.highlight}</span>
            </div>
          </div>
        </>
      );
    }

    if (theme.headerVariant === "cornerRibbon") {
      return (
        <div className="absolute top-3 right-3">
          <div className="rounded-xl px-3 py-2 border border-border/60 bg-background/70 backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">{useCase.icon}</span>
              <span className="text-xs font-semibold text-foreground">{useCase.tag}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="absolute bottom-4 left-4">
        <div
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${theme.iconBgGradientClassName} border border-white/10 shadow-xl shadow-black/10 flex items-center justify-center`}
        >
          <span className="text-lg sm:text-xl">{useCase.icon}</span>
        </div>
      </div>
    );
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true, margin: "-50px" }}
      className="group w-full z-20"
    >
      <ThreeDTiltCard glowGradientClassName={theme.glowGradientClassName} className="rounded-2xl">
        <div className="glass-card rounded-2xl overflow-hidden group-hover:overflow-visible relative border border-glass-border/60">
          <div className="relative aspect-[3/2] overflow-hidden">
            <div className={`absolute inset-0 ${theme.accentGradientClassName} opacity-75`} />
            <img
              src={useCase.image}
              alt={useCase.title}
              className="w-full h-full object-cover relative z-0"
            />
            {header}

            {/* Popup detail   visible only on hover */}
            <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-visible">
              <div className="relative rounded-xl sm:rounded-2xl bg-foreground/90 backdrop-blur-sm border border-white/10 shadow-xl w-[92%] overflow-visible">
                <div
                  className={`absolute -top-3 -left-3 w-10 h-10 rounded-2xl ${theme.accentGradientClassName} opacity-40`}
                />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/40 rounded-tr shrink-0" />
                <p className="p-4 sm:p-5 text-sm sm:text-base text-white/95 text-center leading-relaxed whitespace-normal">
                  {useCase.strapline}
                </p>
              </div>
            </div>
          </div>

          <div className="relative p-3 sm:p-4">
            {theme.headerVariant === "cornerRibbon" ? (
              <>
                <p className="text-center text-muted-foreground text-xs sm:text-sm">{useCase.subtitle}</p>
                <p className="mt-1 text-center font-semibold text-foreground text-sm sm:text-base">
                  {useCase.title}
                </p>
              </>
            ) : theme.headerVariant === "floatingIcon" ? (
              <>
                <p className="text-center font-semibold text-foreground text-sm sm:text-base">{useCase.title}</p>
                <div className="mt-1 flex justify-center">
                  <span className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full ${theme.accentGradientClassName} border border-border/40 text-foreground`}>
                    {useCase.highlight}
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 sm:mt-3 text-center font-semibold text-foreground text-sm sm:text-base">
                  {useCase.title}
                </p>
                {useCase.subtitle && (
                  <p className="text-center text-muted-foreground text-xs sm:text-sm mt-0.5">
                    {useCase.subtitle}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </ThreeDTiltCard>
    </motion.div>
  );
};

const UseCasesSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInView, setIsInView] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);

  useEffect(() => {
    const sectionEl = containerRef.current;
    if (!sectionEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.35 }
    );
    observer.observe(sectionEl);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (useCases.length <= 1) return;
    if (!isInView) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % useCases.length);
    }, 2000);
    return () => window.clearInterval(id);
  }, [isInView]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const el = itemRefs.current[activeIndex];
    if (!scroller || !el) return;
    if (!isInView) return;

    // Scroll ONLY the horizontal container (avoid jumping page vertically).
    const scrollerRect = scroller.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const delta = (elRect.left - scrollerRect.left) - (scrollerRect.width - elRect.width) / 2;
    scroller.scrollTo({ left: scroller.scrollLeft + delta, behavior: "smooth" });
  }, [activeIndex, isInView]);

  return (
    <section
      ref={containerRef}
      className="relative bg-background flex flex-col items-center py-10 sm:py-12 md:py-16 overflow-hidden"
    >
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 jointlly-grid opacity-40" />

      {/* Header */}
      <motion.div
        className="relative z-20 text-center px-4 sm:px-6 mb-6 sm:mb-8 md:mb-12"
        style={{ opacity }}
      >
        <div className="mb-5 flex justify-center">
          <Link
            to="/auth"
            state={{ userType: "landowner", authMode: "login" }}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#52b788] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#45a377]"
          >
            Property Owner
          </Link>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
          <span className="text-gradient-primary">One Platform,</span>
          <br />
          <span className="text-foreground">Every Project Type</span>
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
          Explore residential, commercial, industrial, and interior projects all from one place.
        </p>
      </motion.div>

      {/* Content area: one-by-one slider (80% width) */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6">
        <style>{`
          [data-usecases-slider]::-webkit-scrollbar { display: none; }
        `}</style>
        <div
          ref={scrollerRef}
          data-usecases-slider
          className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {useCases.map((useCase, index) => (
            <div
              key={useCase.id}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              className="snap-center shrink-0 w-full flex justify-center"
            >
              <div className="w-[92%] sm:w-[80%] py-2">
                <UseCaseCard useCase={useCase} index={index} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
};

export default UseCasesSection;
