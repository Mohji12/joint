import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, AlertCircle, Users, Wrench, Search, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import resdentialHero from "@/assets/resdentialhero.png";

const Residential = () => {
  const strategicBreakdown = [
    {
      title: "Private Estates (Villas)",
      description:
        "High-value, standalone structures focused on lifestyle amenities and private land ownership.",
    },
    {
      title: "Income-Generating Assets (Duplexes/Apartments)",
      description:
        "Multifunctional designs that allow owners to occupy one unit while leveraging the remaining units for cash flow.",
    },
    {
      title: "Low-Rise Urban Density",
      description:
        "Scalable structures that maximize land utility without the complexity of high-rise engineering.",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[100vh] flex flex-col justify-center pt-24 sm:pt-28 pb-16 sm:pb-24 overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${resdentialHero})` }}
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
                <span className="text-gradient-primary">Residential</span>
                <br />
                <span className="text-foreground">Construction</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-xl">
                Low-rise structures, typically two to three stories, designed for private ownership or investment from villas to duplexes and low-rise apartments.
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

      {/* What is Residential   Overview */}
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
              <span className="text-gradient-primary">What is Residential</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto px-1">
              Residential construction focuses on the development of low-rise structures, typically two to three stories in height, designed for private ownership or investment. This category encompasses diverse housing models, including villas optimized for single-family privacy and multi-unit dwellings such as duplexes or low-rise apartments. These assets are strategically built to serve as primary residences or to generate consistent rental yields for the owner.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Strategic Breakdown   Steps */}
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
              <span className="text-gradient-primary">Strategic Breakdown</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              To align with a high-level business perspective, here is how we categorize these residential assets:
            </p>
          </motion.div>

          {/* Steps layout: vertical on mobile, horizontal on desktop with connectors */}
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-stretch gap-0">
            {strategicBreakdown.map((item, index) => {
              const stepNumber = index + 1;
                const isLast = index === strategicBreakdown.length - 1;
                return (
                  <div key={item.title} className="flex flex-col md:flex-row md:flex-1 md:min-w-0 items-center md:items-stretch">
                    {/* Single step block */}
                    <motion.div
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.15 }}
                      viewport={{ once: true }}
                      className="relative flex flex-col flex-1 text-center md:text-left p-5 sm:p-6 md:p-8 lg:p-10"
                    >
                      {/* Step number circle */}
                      <div className="flex justify-center md:justify-start mb-4 sm:mb-6">
                        <div className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary to-accent text-white font-bold text-lg sm:text-xl shadow-lg shadow-primary/25">
                          {stepNumber}
                        </div>
                      </div>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-2 sm:mb-3 text-foreground">{item.title}</h3>
                      <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{item.description}</p>
                    </motion.div>

                    {/* Connector: horizontal line + arrow (desktop only) */}
                    {!isLast && (
                      <div className="hidden md:flex flex-shrink-0 w-10 lg:w-14 self-center justify-center">
                        <div className="flex items-center gap-0.5 w-full">
                          <div className="h-0.5 flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
                          <ArrowRight className="w-5 h-5 text-primary flex-shrink-0" />
                          <div className="h-0.5 flex-1 bg-gradient-to-l from-accent/50 to-transparent" />
                        </div>
                      </div>
                    )}

                    {/* Connector for mobile: vertical line + arrow between steps */}
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

      {/* Common Challenges Section */}
      <section className="relative py-16 sm:py-20 md:py-24 lg:py-32">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 jointlly-grid opacity-40" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-12 md:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              <span className="text-gradient-primary">Common Challenges</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Property owners face significant hurdles when navigating residential construction. Here are the most common scenarios and their challenges:
            </p>
          </motion.div>

          <div className="space-y-12 sm:space-y-16">
            {/* Type 1 */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative pl-5 sm:pl-6 md:pl-8 border-l-2 border-primary/40"
            >
              <div className="absolute left-0 top-0 w-6 h-6 sm:w-8 sm:h-8 -translate-x-1/2 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-bold shadow-md">
                1
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-3 mt-0.5 sm:mt-1">
                Property Owner with Funds but No Construction Expertise
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl">
                If someone owns land and has money to build but lacks construction know-how, options are limited and blind:
              </p>
              <ul className="space-y-4 mb-6">
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Ask friends or family for referrals based on past experience, handing over the project without vetting the builder firsthand.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Walk into a nearby ongoing construction site with naive expectations.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Endlessly browse online portals and forums hunting for a trustworthy, experienced builder near their property.
                  </span>
                </li>
              </ul>
              <div className="p-5 rounded-xl bg-primary/5 border border-primary/10 mb-8">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">The Reality:</strong> There are excellent small-scale or solo builders who deliver honest work with top-quality products and on-time completion at affordable prices but online searches and social media spotlight only big companies, overshadowing these hidden gems.
                </p>
              </div>

              <div className="rounded-xl p-4 sm:p-5 md:p-6 lg:p-8">
                <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="font-times">Jointlly</span>'s Role & Solution
                </h4>
                <p className="text-muted-foreground mb-5">
                  Jointlly functions as a decision-enablement and discovery platform, helping owners make more informed shortlisting decisions before engaging independently with any builder.
                </p>
                <p className="text-sm font-semibold text-foreground mb-3">The platform provides:</p>
                <ul className="space-y-2 mb-5">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Structured profiles of builders and construction professionals, based on self-disclosed data, past work signals, and market-visible indicators
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Non-promotional comparisons across parameters such as project type experience, scale alignment, and indicative execution patterns
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Contextual information to help owners ask better technical and commercial questions during their own evaluation
                    </span>
                  </li>
                </ul>
                <div className="p-4 rounded-lg bg-muted/80 border border-border">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Important:</strong> Jointlly does not recommend, certify, appoint, or supervise builders. It does not validate execution quality or guarantee outcomes. Owners are advised to conduct independent technical, legal, and contractual due diligence before final engagement.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong className="text-foreground">Outcome:</strong> Reduced search opacity and improved decision clarity without replacing the owner's responsibility or professional advisors.
                </p>
              </div>
            </motion.div>

            {/* Type 2 */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              viewport={{ once: true }}
              className="relative pl-5 sm:pl-6 md:pl-8 border-l-2 border-primary/40"
            >
              <div className="absolute left-0 top-0 w-6 h-6 sm:w-8 sm:h-8 -translate-x-1/2 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-bold shadow-md">
                2
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-3 mt-0.5 sm:mt-1">
                Property Owner Seeking Revenue via Joint Venture/Development (JV/JD)
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl">
                For owners without full funds who want revenue or a higher-value constructed property through JV/JD, finding a reliable builder is a gamble:
              </p>
              <ul className="space-y-4 mb-6">
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Rely on brokers or mediators (charging 2-3% commissions in Bangalore), where the landowner pays half (or full) upfront based on urgency yet remains unsure about work quality, timelines, or key government laws. Brokers often push builders who pay them higher kickbacks, sidelining better-quality options that won't pay extra.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Cold-call builders online, who often lowball the property value with flimsy excuses, hide critical rules like FAR, height restrictions, setbacks, and bylaws (to tweak plans in their favor, risking deviations during Construction Certificate approval).
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    No dedicated websites or apps exist just for JD/JV online marketplaces focus only on buy/sell or rentals.
                  </span>
                </li>
              </ul>

              <div className="rounded-xl p-4 sm:p-5 md:p-6 lg:p-8">
                <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="font-times">Jointlly</span>'s Role & Solution
                </h4>
                <p className="text-muted-foreground mb-5">
                  Jointlly acts as a neutral information and matching facilitator, enabling landowners to understand development possibilities and partner profiles before entering discussions.
                </p>
                <p className="text-sm font-semibold text-foreground mb-3">The platform provides:</p>
                <ul className="space-y-2 mb-5">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Indicative regulatory context (such as FAR ranges, zoning references, and high-level planning constraints) sourced from publicly available government frameworks
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Structured partner discovery based on stated development preferences, project scale alignment, and prior JV/JD participation signals
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Comparable high-level deal structures (illustrative only) to improve conceptual understanding not legal or financial advice
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
                      <span className="text-xs text-muted-foreground">Value land or projects</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-3 h-3 text-muted-foreground mt-1 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">Advise on deal terms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-3 h-3 text-muted-foreground mt-1 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">Negotiate, mediate, or conclude agreements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-3 h-3 text-muted-foreground mt-1 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">Replace legal, financial, or planning consultants</span>
                    </li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    All JV/JD decisions, valuations, approvals, and agreements must be independently assessed by qualified professionals.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong className="text-foreground">Outcome:</strong> Better-informed partner exploration with reduced dependence on opaque intermediaries while preserving full owner control and accountability.
                </p>
              </div>
            </motion.div>

            {/* Type 3 */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="relative pl-5 sm:pl-6 md:pl-8 border-l-2 border-primary/40"
            >
              <div className="absolute left-0 top-0 w-6 h-6 sm:w-8 sm:h-8 -translate-x-1/2 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-bold shadow-md">
                3
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-3 mt-0.5 sm:mt-1">
                House/Flat Owner Needing Partial Renovation/Repaint
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl">
                Renovating part of an existing house or flat often means settling for unvetted small-scale operators:
              </p>
              <ul className="space-y-4 mb-6">
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Ask nearby under-construction workers, who may override engineers for quick cash lacking real expertise in load-bearing beams/columns, they alter walls or add weight to slab roofs without support, causing major structural damage.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Turn to a "known circle" builder, who exploits the trust to charge inflated prices, hiking overall costs and leaving the owner at a loss.
                  </span>
                </li>
              </ul>

              <div className="rounded-xl p-4 sm:p-5 md:p-6 lg:p-8">
                <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="font-times">Jointlly</span>'s Role & Solution
                </h4>
                <p className="text-muted-foreground mb-5">
                  Jointlly provides a discovery and filtering layer to help owners identify professionals whose declared experience aligns with the stated nature of work.
                </p>
                <p className="text-sm font-semibold text-foreground mb-3">The platform enables:</p>
                <ul className="space-y-2 mb-5">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Categorized discovery of professionals based on renovation type (non-structural, interior-only, structural modification, etc.)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Experience indicators and scope disclosures shared by professionals to help owners assess relevance
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Information prompts that encourage owners to seek structural engineers, approvals, and drawings where applicable
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
                      <span className="text-xs text-muted-foreground">Approve structural changes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-3 h-3 text-muted-foreground mt-1 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">Validate technical safety</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-3 h-3 text-muted-foreground mt-1 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">Replace engineers, architects, or statutory authorities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-3 h-3 text-muted-foreground mt-1 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">Supervise on-site work</span>
                    </li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    Owners remain fully responsible for ensuring compliance with building laws, society rules, and local authority approvals.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Residential;
