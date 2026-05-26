import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import industrialHero from "@/assets/industrialhero.png";

const Industrial = () => {
  const components = [
    {
      title: "Reinforced Concrete Flooring",
      description: "The most critical part of the structure. It is significantly thicker than standard floors to support the weight of heavy machinery and the constant movement of forklifts without cracking.",
    },
    {
      title: "Large-Span Steel Frames",
      description: "Heavy-grade steel is used to create beams for wide, open interior spaces with minimal pillars. This allows for unobstructed assembly lines and massive storage racks.",
    },
    {
      title: "High-Clearance Verticality",
      description: "Structures are built with extreme 'clear heights' (often 30 to 60 feet) to accommodate vertical racking systems and specialized overhead cranes.",
    },
    {
      title: "Specialized MEP Systems",
      description: "The 'veins' of the building Mechanical, Electrical, and Plumbing are often exposed and heavy-duty, designed to handle high-voltage power for machines and advanced ventilation for chemical or heat exhaust.",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[100vh] flex flex-col justify-center pt-24 sm:pt-28 pb-16 sm:pb-24 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${industrialHero})` }}
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
                <span className="text-gradient-primary">Industrial</span>
                <br />
                <span className="text-foreground">Construction</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-xl">
                Precision-engineered shells built for heavy-duty performance and massive scale. Structures engineered to prioritize strength over aesthetics, designed to protect massive machinery and handle extreme physical stress.
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

      {/* What is Industrial   Overview */}
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
              <span className="text-gradient-primary">What is Industrial</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto px-1">
              In industrial construction, the structure is engineered to prioritize strength over aesthetics. Unlike a house or an office, an industrial building is essentially a high-performance "shell" designed to protect massive machinery and handle extreme physical stress.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Key Structural Components   Steps */}
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
              <span className="text-gradient-primary">Key Structural Components</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The essential elements that make industrial buildings capable of handling extreme physical stress
            </p>
          </motion.div>

          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-stretch gap-0">
              {components.map((item, index) => {
                const stepNumber = index + 1;
                const isLast = index === components.length - 1;
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
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Industrial projects are high-stakes engineering assets. A minor mistake in flooring, structural loading, or power
              planning can make a facility unusable. Here is how Jointlly supports owners across three real-world scenarios:
            </p>
          </motion.div>

          <div className="space-y-16">
            {/* Type 1   Greenfield industrial execution */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative pl-6 md:pl-8 border-l-2 border-primary/40"
            >
              <div className="absolute left-0 top-0 w-8 h-8 -translate-x-1/2 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">
                1
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3 mt-1">
                1. Funded Owner Navigating Industrial Execution (Greenfield Projects)
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl">
                Building a factory or Grade-A warehouse requires specialized supply chains: pre-engineered buildings (PEB),
                high-tolerance industrial flooring, and heavy-duty MEP. Many owners accidentally hire standard commercial
                contractors who cast regular slabs that crack under vertical racking or VNA forklifts, while HT power sanctions
                and pollution control approvals stall progress.
              </p>
              <div className="rounded-xl p-6 md:p-8">
                <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="font-times">Jointlly</span>'s Role & Solution
                </h4>
                <p className="text-muted-foreground mb-5">
                  Jointlly functions as a decision-enablement platform tailored for heavy-duty execution, ensuring capital is
                  directed toward specialized industrial expertise.
                </p>
                <p className="text-sm font-semibold text-foreground mb-3">The platform supports owners with:</p>
                <ul className="space-y-2 mb-5">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Specialized contractor discovery with categorized profiles of PEB manufacturers, industrial civil
                      contractors, and industrial flooring experts (including FM2/FM3-compliant execution).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      A layer of checking via self-disclosed and market-visible indicators about past industrial tonnage
                      handled, clear-height capabilities, and heavy MEP integration.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Contextual prompts around soil bearing capacity (SBC) testing, industrial fire compliance, and the role of
                      specialized industrial architects.
                    </span>
                  </li>
                </ul>
                <div className="p-4 rounded-lg bg-muted/80 border border-border">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Important:</strong> Jointlly does not certify structural integrity or
                    supervise on-site execution. Owners must conduct rigorous technical due diligence and, where needed, engage
                    independent project management consultants (PMCs) and licensed structural engineers before final engagement.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong className="text-foreground">Outcome:</strong> Better alignment between industrial intent and execution
                  capability, reducing the risk of non-usable floors or under-specified structures.
                </p>
              </div>
            </motion.div>

            {/* Type 2   Industrial JV/JD for warehousing & logistics parks */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              viewport={{ once: true }}
              className="relative pl-6 md:pl-8 border-l-2 border-primary/40"
            >
              <div className="absolute left-0 top-0 w-8 h-8 -translate-x-1/2 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">
                2
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3 mt-1">
                2. Landowner Seeking Industrial JV/JD (Warehousing & Logistics Parks)
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl">
                Highway-corridor land can support high-yield logistics parks, yet many intermediaries push low-clearance shed
                developments that underperform. Without visibility into industrial zoning, FAR, and Grade-A warehousing norms,
                landowners often accept suboptimal proposals and long-term rentals.
              </p>
              <div className="rounded-xl p-6 md:p-8">
                <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="font-times">Jointlly</span>'s Role & Solution
                </h4>
                <p className="text-muted-foreground mb-5">
                  Jointlly acts as a neutral information and matching facilitator, equipping landowners to understand the true
                  yield potential of their industrial land before engaging developers.
                </p>
                <p className="text-sm font-semibold text-foreground mb-3">The platform provides:</p>
                <ul className="space-y-2 mb-5">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Regulatory and yield visibility via indicative context on industrial zoning (such as yellow/purple zones)
                      and the differences between Grade-A and Grade-B infrastructure.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Neutral partner discovery, connecting landowners with developers who have a track record in building and
                      leasing industrial parks, with access gated by a client platform access fee to ensure serious intent.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Comparable, high-level examples of industrial JV/JD models (such as built-to-suit leases versus revenue
                      share) to improve conceptual understanding only.
                    </span>
                  </li>
                </ul>
                <div className="p-4 rounded-lg bg-muted/80 border border-border">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Important:</strong> Jointlly does not value land, calculate industrial
                    yield, or advise on deal terms. All land conversions, valuations, leases, and JD agreements must be
                    independently assessed by specialized industrial real-estate, legal, and financial advisors.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong className="text-foreground">Outcome:</strong> Better-informed exploration of industrial JV/JD options,
                  with reduced dependence on opaque intermediaries and clearer expectations about long-term yield potential.
                </p>
              </div>
            </motion.div>

            {/* Type 3   Industrial retrofitting & capacity expansion */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="relative pl-6 md:pl-8 border-l-2 border-primary/40"
            >
              <div className="absolute left-0 top-0 w-8 h-8 -translate-x-1/2 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">
                3
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3 mt-1">
                3. Industrial Retrofitting & Capacity Expansion (Brownfield Projects)
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl">
                Expanding a live factory adding EOT cranes, mezzanines, or heavier machinery is complex and risk-prone.
                Unvetted contractors may weld extra members or modify columns without dynamic load analysis, risking structural
                failure once equipment is commissioned.
              </p>
              <div className="rounded-xl p-6 md:p-8">
                <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="font-times">Jointlly</span>'s Role & Solution
                </h4>
                <p className="text-muted-foreground mb-5">
                  Jointlly provides a specialized discovery layer to identify professionals equipped for high-risk industrial
                  modifications while minimizing operational disruption.
                </p>
                <p className="text-sm font-semibold text-foreground mb-3">The platform enables:</p>
                <ul className="space-y-2 mb-5">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Categorized discovery of professionals experienced in industrial retrofitting, structural strengthening, and
                      heavy MEP upgrades.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Experience indicators and disclosures about executing within live, operational factories where safety,
                      downtime, and phasing are critical.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Information prompts that nudge owners to engage licensed industrial structural engineers, perform dynamic
                      load testing, and secure revised approvals from factory inspectorates and other authorities.
                    </span>
                  </li>
                </ul>
                <div className="p-4 rounded-lg bg-muted/80 border border-border">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Important:</strong> Jointlly does not validate structural safety, approve
                    modifications, or replace statutory authorities. Facility owners remain fully responsible for compliance,
                    worker safety, and structural integrity.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong className="text-foreground">Outcome:</strong> More informed selection of retrofitting partners and
                  clearer awareness of the technical checks required before expanding capacity.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Industrial;
