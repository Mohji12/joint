import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, TrendingUp, Award, Heart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  const values = [
    {
      icon: Shield,
      title: "Trust & Transparency",
      description: "We believe in complete transparency. Every project, every transaction, every decision is built on trust and verified by AI.",
    },
    {
      icon: TrendingUp,
      title: "Innovation First",
      description: "Leveraging cutting-edge AI technology to revolutionize how real estate projects are planned, executed, and managed.",
    },
    {
      icon: Award,
      title: "Excellence",
      description: "We set the highest standards for quality, ensuring every project meets our rigorous criteria for success.",
    },
    {
      icon: Heart,
      title: "Community Focus",
      description: "Building stronger communities by connecting landowners and builders, creating value for everyone involved.",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      {/* About Jointlly */}
      <section className="relative py-10 sm:py-12 md:py-16 lg:py-20">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 jointlly-grid opacity-40" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6 sm:space-y-8"
          >
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                <span className="text-gradient-primary">
                  About <span className="font-times">Jointlly</span>
                </span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Jointlly is the decision-enablement ecosystem for real estate development. We are a neutral information and
                discovery platform designed to dismantle the opacity of the construction industry.
              </p>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                We provide landowners and property seekers with the data-driven clarity needed to move from{" "}
                <span className="font-semibold">owning land</span> to <span className="font-semibold">building assets</span>{" "}
                with confidence. In an industry often clouded by biased referrals and complex regulatory hurdles, Jointlly
                serves as a trust layer by structuring fragmented market data into comparable, high-level insights across
                residential, commercial, and industrial sectors.
              </p>
            </div>

            {/* Structural Pillars */}
            <div className="space-y-4">
              <h3 className="text-xl sm:text-2xl font-semibold text-foreground">
                Our Structural Pillars
              </h3>
              <div className="overflow-x-auto rounded-xl border border-border bg-background shadow-sm">
                <table className="min-w-full text-left text-sm sm:text-base">
                  <thead className="bg-primary text-primary-foreground">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 font-semibold">Pillar</th>
                      <th className="px-4 sm:px-6 py-3 font-semibold">What it means</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border/60 bg-background">
                      <td className="align-top px-4 sm:px-6 py-4 font-medium text-foreground">
                        Neutral Discovery
                      </td>
                      <td className="align-top px-4 sm:px-6 py-4 text-muted-foreground">
                        We provide structured profiles of builders and developers based on self disclosed data and
                        market-visible signals, not paid promotions.
                      </td>
                    </tr>
                    <tr className="border-t border-border/60 bg-background">
                      <td className="align-top px-4 sm:px-6 py-4 font-medium text-foreground">
                        Decision Enablement
                      </td>
                      <td className="align-top px-4 sm:px-6 py-4 text-muted-foreground">
                        We empower owners to ask better technical and commercial questions through non promotional
                        comparisons of project scales and execution patterns.
                      </td>
                    </tr>
                    <tr className="border-t border-border/60 bg-background">
                      <td className="align-top px-4 sm:px-6 py-4 font-medium text-foreground">
                        Regulatory Context
                      </td>
                      <td className="align-top px-4 sm:px-6 py-4 text-muted-foreground">
                        We bridge the knowledge gap by providing indicative public regulatory frameworks, from FAR ranges
                        to zoning references, so owners understand the context they are building in.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Methodology */}
            <div className="space-y-4">
              <h3 className="text-xl sm:text-2xl font-semibold text-foreground">
                The Jointlly Methodology: Solving Ground Realities
              </h3>
              <div className="space-y-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
                <p>
                  <span className="font-semibold">1. Residential   Bridging the expertise gap.</span> For private owners,
                  residential construction is deeply personal but technically daunting. Jointlly simplifies the search for
                  “hidden gem” builders and small scale professionals who deliver high quality work by providing a structured
                  filtering layer that prioritizes objective track records over marketing budgets.
                </p>
                <p>
                  <span className="font-semibold">2. Commercial   High performance infrastructure.</span> Commercial builds are
                  high stakes business assets. Jointlly helps owners navigate the complexities of Grade A office spaces,
                  retail hubs, and managed living by connecting them with professionals capable of handling heavy duty MEP
                  systems and stringent statutory safety codes.
                </p>
                <p>
                  <span className="font-semibold">3. Industrial   Precision engineered performance.</span> In the industrial
                  sector, the structure is a high performance shell. A minor miscalculation in floor leveling or structural
                  load can render a facility unusable. Jointlly facilitates the discovery of specialized PEB experts and
                  industrial civil contractors who understand the rigorous demands of modern logistics and manufacturing.
                </p>
              </div>
            </div>

            {/* Operating Principle */}
            <div className="space-y-3">
              <h3 className="text-xl sm:text-2xl font-semibold text-foreground">
                Our Operating Principle
              </h3>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Jointlly is an information bridge, not a supervisor. We do not recommend, certify, or appoint builders. We
                do not validate execution quality or guarantee outcomes.
              </p>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Our mission is to reduce search opacity and improve decision clarity, while ensuring the owner retains full
                responsibility for independent technical, legal, and contractual due diligence.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="relative py-10 sm:py-12 md:py-16 lg:py-20">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 jointlly-grid opacity-40" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-5 sm:space-y-6"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
              <span className="text-gradient-primary">Our Mission</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              To deconstruct the opacity of the construction industry by providing a neutral, data driven trust layer for
              property development.
            </p>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              At Jointlly, we believe that the journey from owning land to building a high performing asset should not be a
              gamble. Our mission is to empower landowners and investors with decision enablement tools that replace blind
              referrals and intermediary bias with structured discovery and objective information.
            </p>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                The Three Pillars of the Jointlly Mission
              </h3>
              <ul className="space-y-3 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside">
                <li>
                  <span className="font-semibold">Dismantling information asymmetry:</span> We provide indicative regulatory
                  context from FAR ranges to zoning references ensuring that landowners understand the true potential of their
                  property before entering negotiations.
                </li>
                <li>
                  <span className="font-semibold">Highlighting “hidden gems”:</span> Our platform provides a stage for
                  high quality, small to mid scale builders who deliver honest work and technical excellence but are often
                  overshadowed by large corporate marketing budgets.
                </li>
                <li>
                  <span className="font-semibold">Enabling professional independence:</span> We do not replace the owner’s
                  responsibility; we sharpen it. By providing comparative project scale data and technical prompts, we help
                  owners ask the right questions and conduct better independent due diligence.
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                Our Why
              </h3>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Whether it is a private villa, a Grade A corporate hub, or a high precision industrial shell, the structural
                integrity of an asset is a multi generational commitment. Jointlly exists to ensure that every stakeholder,
                regardless of their construction expertise, has access to a transparent ecosystem where skill meets scale and
                data meets development.
              </p>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                The outcome: reduced search opacity, improved decision clarity, and a marketplace built on verified
                professional signals rather than empty promises.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How Jointlly Works */}
      <section className="relative py-10 sm:py-12 md:py-16 lg:py-20">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 jointlly-grid opacity-40" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6 sm:space-y-8"
          >
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                <span className="text-gradient-primary">How Jointlly Works</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                From land to asset, Jointlly acts as your strategic discovery filter. We do not just list names; we give you
                the context to choose the right partner with confidence.
              </p>
            </div>

            {/* Steps 1 5 overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  Step 1: Define your development intent
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Select your project category residential, commercial, or industrial. By specifying your intent (self build,
                  joint venture, or renovation), the platform tailors the data environment to your specific regulatory and
                  engineering needs.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  Step 2: Access indicative context
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Before you speak to a builder, understand your land’s potential. Jointlly surfaces high level indicators
                  relevant to your category, focusing on functional constraints and regulatory nuances that determine
                  long term viability and legal safety the silent deal breakers experienced builders know, but owners often
                  overlook.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  Step 3: Discover scale matched partners
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Browse a curated ecosystem of builders and developers whose profiles are structured around self disclosed
                  data and market visible signals. Filter by project type experience, review scale alignment, and explore
                  portfolios that emphasize technical delivery over marketing fluff.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  Step 4: Comparative shortlisting
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Use non promotional comparison views to evaluate by professionals side by side looking past brand names to
                  compare execution patterns, specialized MEP capabilities, and historical project scales.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  Step 5: Engage with professional clarity
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Armed with Jointlly’s contextual prompts and structured data, you can engage independently. Use our
                  technical inquiry guides to ask sharper questions during site visits and meetings, supporting rigorous,
                  independent legal, technical, and commercial due diligence.
                </p>
              </div>
            </div>

            {/* Deep-dive: Residential / Commercial / Industrial */}
            <div className="space-y-6">
              <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                Going deeper: category specific ground realities
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm sm:text-base text-muted-foreground leading-relaxed">
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">1. Residential   Beyond cost and height</h4>
                  <p>
                    The difference between a legal home and a permanent liability lies in adherence to granular norms from OC
                    exemptions for smaller plots, to open to sky percolation setbacks, to safe staircase geometry. Jointlly
                    highlights these checks so owners do not discover them only at the approval or handover stage.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">2. Commercial   Beyond FAR and zoning</h4>
                  <p>
                    Commercial assets are valued on efficiency ratios, not just built up area. We surface insights around
                    premium FAR and TDR loading, fire tender access geometry, and ventilated basement rules so that design and
                    compliance decisions preserve long term leasability.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">3. Industrial   Beyond clear heights and floor loads</h4>
                  <p>
                    Industrial shells are tools for machinery. Jointlly emphasizes soil bearing capacity, point loading,
                    high precision flooring standards, and HT power and buffer zone requirements so that the building’s
                    performance envelope truly matches the process it must support.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  The final outcome
                </h3>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  You exit Jointlly not just with a contact number, but with a development strategy reduced search opacity,
                  improved decision clarity, and full control over your legal and financial commitments.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="relative py-10 sm:py-12 md:py-16 lg:py-20">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 jointlly-grid opacity-40" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-6 sm:mb-8 md:mb-10"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3">
              <span className="text-gradient-primary">Our Values</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative pl-5 sm:pl-6 md:pl-8 border-l-2 border-primary/40"
                >
                  <div className="absolute left-0 top-0 w-6 h-6 sm:w-8 sm:h-8 -translate-x-1/2 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-2 sm:mb-3 mt-0.5 sm:mt-1">
                    {value.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-10 sm:py-12 md:py-16 lg:py-20">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 jointlly-grid opacity-40" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-3 sm:space-y-4"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              Ready to build with transparency?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground px-2">
              Join thousands of landowners and builders who trust Jointlly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
              <Link to="/contact" className="btn-premium inline-flex items-center justify-center gap-2 min-h-[44px]">
                Contact Us
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/" className="btn-premium-outline inline-flex items-center justify-center gap-2 min-h-[44px]">
                Explore Platform
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
