import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Hammer, Handshake, Palette, Wrench } from "lucide-react";

const options = [
  {
    id: "contract-construction",
    title: "Contract construction",
    description: "I am planning to construct a property and need a professional team.",
    icon: Hammer,
    path: "/landowner/contract-construction",
  },
  {
    id: "joint-venture",
    title: "Joint venture",
    description: "I own land and am exploring joint venture or joint development opportunities (JV/JD).",
    icon: Handshake,
    path: "/landowner/joint-venture",
  },
  {
    id: "interior",
    title: "Interior architecture",
    description: "I am seeking an interior architecture or design professional.",
    icon: Palette,
    path: "/landowner/interior",
  },
  {
    id: "reconstruction",
    title: "Renovation / repaint work",
    description: "I want to make repairs or improvements to my existing space.",
    icon: Wrench,
    path: "/landowner/reconstruction",
  },
];

const LandownerPage = () => {
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
              to="/landowner/dashboard"
              className="text-sm text-primary hover:underline"
            >
              Dashboard
            </Link>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              <span className="text-foreground">Landowner</span>
              <span className="text-gradient-primary"> / Property Owner</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the option that best describes what you need. We’ll guide you through the next steps.
            </p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2">
            {options.map((opt, i) => (
              <motion.div
                key={opt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link to={opt.path} className="block group">
                  <div className="glass-card rounded-2xl p-6 md:p-8 border border-glass-border group-hover:border-primary/30 transition-colors h-full flex flex-col text-left">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <opt.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {opt.title}
                    </h2>
                    <p className="text-muted-foreground flex-1">{opt.description}</p>
                    <span className="inline-flex items-center gap-1 text-primary font-medium mt-4 group-hover:gap-2 transition-all">
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

export default LandownerPage;
