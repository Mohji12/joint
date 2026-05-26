import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import interiorHero from "@/assets/interiorhero.png";

const Interior = () => {
  const pillars = [
    {
      title: "Spatial Optimization",
      description: "Designing the 'flow' of a space to maximize every square foot for its intended purpose.",
    },
    {
      title: "Technical Integration",
      description: "Managing internal systems such as lighting, acoustics, and climate control within the architectural layout.",
    },
    {
      title: "Material Selection",
      description: "Specifying finishes and furnishings that meet durability requirements and design philosophies.",
    },
    {
      title: "Human-Centric Design",
      description: "Prioritizing ergonomics and psychological comfort to enhance the user experience.",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[100vh] flex flex-col justify-center pt-24 sm:pt-28 pb-16 sm:pb-24 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${interiorHero})` }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4 sm:space-y-6"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                <span className="text-gradient-primary">Interior</span>
                <br />
                <span className="text-foreground">Architecture</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-xl">
                Transform raw internal spaces into functional, high-value environments by balancing technical structural needs with modern design. Create interiors that are both operationally efficient and aesthetically refined.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                <Link to="/contact" className="btn-premium inline-flex items-center justify-center gap-2 min-h-[44px]">
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/auth" state={{ userType: "landowner", authMode: "login" }} className="btn-premium-outline inline-flex items-center justify-center gap-2 min-h-[44px]">
                  Explore Options
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What is Interior   Overview */}
      <section className="relative py-16 sm:py-20 md:py-24 lg:py-32">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 jointlly-grid opacity-40" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-5 sm:space-y-8"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight">
              <span className="text-gradient-primary">What is Interior Architecture</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto px-1">
              Interior Architecture is the strategic process of transforming a building's internal volume into a functional, high-value environment tailored to specific user needs. This discipline blends technical structural knowledge with modern aesthetics to ensure that internal spaces are as operationally efficient as they are visually balanced.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Key Components of Interior Architecture   Steps */}
      <section className="relative py-12 sm:py-16 md:py-20">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 jointlly-grid opacity-40" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-12 md:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              <span className="text-gradient-primary">Key Components of Interior Architecture</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              To understand the discipline from a results-oriented perspective, it is broken down into four core pillars:
            </p>
          </motion.div>

          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-stretch gap-0">
              {pillars.map((item, index) => {
                const stepNumber = index + 1;
                const isLast = index === pillars.length - 1;
                return (
                  <div key={item.title} className="flex flex-col md:flex-row md:flex-1 md:min-w-0 items-center md:items-stretch">
                    <motion.div
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="relative flex flex-col flex-1 text-center md:text-left p-6 md:p-8"
                    >
                      <div className="flex justify-center md:justify-start mb-4">
                        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent text-white font-bold text-xl shadow-lg shadow-primary/25">
                          {stepNumber}
                        </div>
                      </div>
                      <h3 className="text-xl md:text-2xl font-semibold mb-3 text-foreground min-h-[3.5rem] md:min-h-[4rem]">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{item.description}</p>
                    </motion.div>
                    {!isLast && (
                      <div className="hidden md:flex flex-shrink-0 w-8 lg:w-10 self-center justify-center">
                        <div className="flex items-center gap-0.5 w-full">
                          <div className="h-0.5 flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
                          <ArrowRight className="w-5 h-5 text-primary flex-shrink-0" />
                          <div className="h-0.5 flex-1 bg-gradient-to-l from-accent/50 to-transparent" />
                        </div>
                      </div>
                    )}
                    {!isLast && (
                      <div className="flex md:hidden flex-col items-center py-1">
                        <div className="w-px h-4 bg-primary/40" />
                        <ArrowRight className="w-5 h-5 text-primary/60 rotate-90" />
                        <div className="w-px h-4 bg-primary/40" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Problem Context & Solution */}
      <section className="relative py-16 sm:py-20 md:py-24 lg:py-32">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 jointlly-grid opacity-40" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative pl-6 md:pl-8 border-l-2 border-primary/40"
          >
            <div className="absolute left-0 top-0 w-8 h-8 -translate-x-1/2 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">
              1
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3 mt-1">
              Problem Context
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl">
              Interior design selection is often influenced by brand visibility rather than suitability. Pricing opacity and limited exposure to independent designers reduce informed choice, though execution responsibility remains entirely with the contracting parties.
            </p>

            <div className="rounded-xl p-6 md:p-8">
              <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="font-times">Jointlly</span>'s Role & Solution
              </h4>
              <p className="text-muted-foreground mb-5">
                Jointlly functions as a design discovery and comparison platform, helping owners explore a broader range of professionals and styles.
              </p>
              <p className="text-sm font-semibold text-foreground mb-3">The platform offers:</p>
              <ul className="space-y-2 mb-5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Designer and architect profiles with declared specialization areas and portfolio references
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Indicative scope-based pricing ranges (non-binding, non-contractual) to aid expectation setting
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Material and design preference visibility to support better alignment discussions
                  </span>
                </li>
              </ul>
              <div className="p-4 rounded-lg bg-muted/80 border border-border">
                <p className="text-xs text-muted-foreground mb-2">
                  <strong className="text-foreground">Jointlly does not:</strong>
                </p>
                <ul className="space-y-1 ml-4">
                  <li className="flex items-start gap-2">
                    <XCircle className="w-3 h-3 text-muted-foreground mt-1 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">Fix prices</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-3 h-3 text-muted-foreground mt-1 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">Endorse design outcomes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-3 h-3 text-muted-foreground mt-1 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">Procure materials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-3 h-3 text-muted-foreground mt-1 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">Manage execution or timelines</span>
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Final quotations, contracts, warranties, and site coordination are solely between the owner and the selected professional.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Interior;
