import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Hammer, Handshake, Palette, Wrench } from "lucide-react";

const options = [
  {
    id: "contract-construction",
    title: "Contract construction",
    description: "Execute projects under a clear legal contract defining scope, cost, timelines, and quality standards.",
    icon: Hammer,
    path: "/builder/contract-construction",
  },
  {
    id: "joint-venture",
    title: "JV / JD developer",
    description: "Partner with landowners through joint venture or joint development agreements.",
    icon: Handshake,
    path: "/builder/joint-venture",
  },
  {
    id: "interior",
    title: "Interior architect / designer",
    description: "Plan and enhance interior spaces for functionality, aesthetics, and comfort.",
    icon: Palette,
    path: "/builder/interior",
  },
  {
    id: "reconstruction",
    title: "Renovation/Repaint, repair work, painter",
    description: "Repair, renovate, or paint existing structures maintenance, upgrades, or refurbishments.",
    icon: Wrench,
    path: "/builder/reconstruction",
  },
];

const BuilderPage = () => {
  return (
    <div className="w-full overflow-x-hidden">
      <section className="relative py-6 sm:py-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 via-background to-background" />
        <div className="relative z-10 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-4 mb-12">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
            <Link
              to="/builder/dashboard"
              className="text-sm text-accent hover:underline"
            >
              Dashboard
            </Link>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              <span className="text-foreground">Construction Company</span>
              <span className="text-gradient-primary"> / Builder</span>
            </h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card rounded-2xl p-6 md:p-8 border border-glass-border mb-16 text-center"
          >
            <h2 className="text-2xl font-bold text-foreground mb-2">Choose How You Would Like to Work With Us</h2>
            <p className="text-muted-foreground mb-2">
              We collaborate with developers, builders, contractors, and designers across multiple project types.
            </p>
            <p className="text-sm text-muted-foreground">
              Please select the option that best describes your area of expertise and complete the relevant details. This information helps us match you with suitable landowners and projects.
            </p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2">
            {options.map((opt, i) => (
              <motion.div
                key={opt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
              >
                <Link to={opt.path} className="block group">
                  <div className="glass-card rounded-2xl p-6 md:p-8 border border-glass-border group-hover:border-accent/30 transition-colors h-full flex flex-col text-left">
                    <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                      <opt.icon className="w-7 h-7 text-accent" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                      {opt.title}
                    </h2>
                    <p className="text-muted-foreground flex-1">{opt.description}</p>
                    <span className="inline-flex items-center gap-1 text-accent font-medium mt-4 group-hover:gap-2 transition-all">
                      Continue
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default BuilderPage;
