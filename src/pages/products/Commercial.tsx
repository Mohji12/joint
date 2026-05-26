import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import commercialHero from "@/assets/commercialhero.png";

const Commercial = () => {
  const categories = [
    {
      title: "Corporate Hubs",
      description: "Massive office towers and IT parks built to sustain the city's status as a global tech capital.",
    },
    {
      title: "Education & Hospitality",
      description: "Expansive school campuses and luxury hotels that require specialized layouts for high-volume traffic.",
    },
    {
      title: "Managed Living ",
      description: "Strategic, multi-story developments designed to house the city's massive influx of young professionals.",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[100vh] flex flex-col justify-center pt-24 sm:pt-28 pb-16 sm:pb-24 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${commercialHero})` }}
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
                <span className="text-gradient-primary">Commercial</span>
                <br />
                <span className="text-foreground">Construction</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-xl">
                High-capacity, income-driven assets that power business growth and recurring cash flows. Built to meet the highest regulatory standards for safety and public use.
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

      {/* What is Commercial   Overview */}
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
              <span className="text-gradient-primary">What is Commercial</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto px-1">
              Commercial construction in Bengaluru is the backbone of the city's economy, focusing on large-scale buildings designed for business, education, and hospitality. Unlike smaller homes, these projects ranging from Grade-A tech parks along the Outer Ring Road to modern co-living PG hubs in HSR Layout must meet much stricter safety and government regulations (like BBMP and fire safety codes) to handle heavy daily use.
            </p>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto px-1">
              Essentially, while residential building is about personal comfort, commercial construction is about building high-performance infrastructure that serves the public and generates professional revenue.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Bengaluru-Specific Business Breakdown   Steps */}
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
              <span className="text-gradient-primary">Bengaluru-Specific Business Breakdown</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              To understand how this looks in our city's current real estate climate, we categorize these structures by their specific function:
            </p>
          </motion.div>

          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-stretch gap-0">
              {categories.map((item, index) => {
                const stepNumber = index + 1;
                const isLast = index === categories.length - 1;
                return (
                  <div key={item.title} className="flex flex-col md:flex-row md:flex-1 md:min-w-0 items-center md:items-stretch">
                    <motion.div
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.15 }}
                      viewport={{ once: true }}
                      className="relative flex flex-col flex-1 text-center md:text-left p-5 sm:p-6 md:p-8 lg:p-10"
                    >
                      <div className="flex justify-center md:justify-start mb-6">
                        <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent text-white font-bold text-xl shadow-lg shadow-primary/25">
                          {stepNumber}
                        </div>
                      </div>
                      <h3 className="text-xl md:text-2xl font-semibold mb-3 text-foreground min-h-[3.5rem] md:min-h-[4rem]">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{item.description}</p>
                    </motion.div>
                    {!isLast && (
                      <div className="hidden md:flex flex-shrink-0 w-10 lg:w-14 self-center justify-center">
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
              Commercial real estate carries very different risks than residential. A single regulatory or structural misstep can
              stall a project for years. Here is how Jointlly supports owners across three key realities:
            </p>
          </motion.div>

          <div className="space-y-16">
            {/* Type 1   Funded owner navigating complex commercial execution */}
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
                1. Funded Owner Navigating Complex Commercial Execution
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl">
                Building a commercial asset demands a very different supply chain and expertise than a villa. Owners sometimes
                hire contractors with purely residential experience, only to later discover gaps in commercial-grade steel
                procurement, complex sub-contractor management for HVAC/BMS, or mandatory software-based approval workflows like
                EODB-OBPS for BBMP. The result: stalled projects and severe cost overruns.
              </p>
              <div className="rounded-xl p-6 md:p-8">
                <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="font-times">Jointlly</span>'s Role & Solution
                </h4>
                <p className="text-muted-foreground mb-5">
                  Jointlly provides a specialized discovery layer for commercial scale so that large capital is not placed on
                  mismatched contractors.
                </p>
                <p className="text-sm font-semibold text-foreground mb-3">The platform helps with:</p>
                <ul className="space-y-2 mb-5">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Scale-matched discovery of builders with demonstrable commercial execution history, separated from purely
                      residential contractors.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      A layer of checking via self-disclosed and market-visible indicators about past commercial project
                      delivery, supply-chain complexity handled, and scale.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Commercial context prompts around the need for specialized MEP consultants, façade specialists, and
                      compliance pathways for public-use buildings.
                    </span>
                  </li>
                </ul>
                <div className="p-4 rounded-lg bg-muted/80 border border-border">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Important:</strong> Jointlly is an information bridge. We do not certify
                    a builder’s financial health, supervise execution, or guarantee outcomes. Owners must run independent
                    technical and financial due diligence before appointment.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong className="text-foreground">Outcome:</strong> Stronger alignment between commercial ambitions and
                  execution capabilities, with fewer surprises mid-project.
                </p>
              </div>
            </motion.div>

            {/* Type 2   Landowner seeking commercial JV/JD */}
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
                2. Landowner Seeking Commercial JV/JD
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl">
                Prime commercial land can command strong yields, yet intermediaries often understate permissible FAR or overstate
                premium FAR and conversion costs. This information asymmetry routinely results in skewed, lowball JD ratios for
                landowners.
              </p>
              <div className="rounded-xl p-6 md:p-8">
                <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="font-times">Jointlly</span>'s Role & Solution
                </h4>
                <p className="text-muted-foreground mb-5">
                  Jointlly dismantles this information asymmetry so landowners walk into negotiations with clearer expectations of
                  what their land can support.
                </p>
                <p className="text-sm font-semibold text-foreground mb-3">The platform provides:</p>
                <ul className="space-y-2 mb-5">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Regulatory visibility via indicative commercial FAR limits and zoning references, especially in the context of
                      Bengaluru’s master plan.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Neutral partner discovery that connects landowners directly with commercial developers who have delivered
                      comparable assets, with access gated by a client platform access fee to ensure serious participation.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Conceptual deal structures through illustrative revenue-sharing models, helping owners understand typical
                      commercial JD frameworks (without providing legal or financial advice).
                    </span>
                  </li>
                </ul>
                <div className="p-4 rounded-lg bg-muted/80 border border-border">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Important:</strong> Jointlly does not perform land valuation, compute
                    yields, or draft legal Joint Development Agreements. All final terms must be vetted by specialized real
                    estate attorneys and financial advisors.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong className="text-foreground">Outcome:</strong> More balanced JV/JD conversations and reduced dependence
                  on opaque intermediaries.
                </p>
              </div>
            </motion.div>

            {/* Type 3   Adaptive reuse & commercial retrofitting */}
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
                3. Adaptive Reuse & Commercial Retrofitting (Change of Land Use)
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl">
                Turning an older residential building into a cloud kitchen, clinic, or retail outlet is both legally and
                structurally sensitive. Unvetted contractors may knock down load-bearing walls to create “open plans,” while
                running commercial operations without e-Khata conversion, trade licenses, or proper fire clearances risks
                sealing or demolition.
              </p>
              <div className="rounded-xl p-6 md:p-8">
                <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="font-times">Jointlly</span>'s Role & Solution
                </h4>
                <p className="text-muted-foreground mb-5">
                  Jointlly helps owners find professionals equipped for the high-stakes nature of commercial retrofitting, where
                  both legal status and structural safety must be treated carefully.
                </p>
                <p className="text-sm font-semibold text-foreground mb-3">The platform enables:</p>
                <ul className="space-y-2 mb-5">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Specialized filtering for professionals experienced in structural modification, adaptive reuse, and
                      commercial interior fit-outs.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Experience indicators and scope disclosures that help owners identify teams familiar with change-of-use
                      scenarios and mixed-use approvals.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Critical information prompts advising owners to engage licensed structural engineers for load analysis and
                      to secure statutory change-of-land-use approvals, e-Khata transitions, and trade licenses before fit-out.
                    </span>
                  </li>
                </ul>
                <div className="p-4 rounded-lg bg-muted/80 border border-border">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Important:</strong> Jointlly does not validate technical safety, approve
                    structural changes, or grant municipal permissions. Owners remain fully responsible for structural integrity
                    and statutory compliance.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong className="text-foreground">Outcome:</strong> Clearer visibility into the risks and professional
                  support needed before converting or retrofitting assets for commercial use.
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

export default Commercial;
