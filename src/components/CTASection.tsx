import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { optionsPathForUserType } from "@/lib/api";

const CTASection = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleBuilderClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/auth", { state: { userType: "builder" } });
    } else if (user) {
      navigate(optionsPathForUserType(user.userType));
    }
  };

  const handleLandownerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/auth", { state: { userType: "landowner" } });
    } else if (user) {
      navigate(optionsPathForUserType(user.userType));
    }
  };

  return (
    <section className="relative py-20 sm:py-24 md:py-32 overflow-hidden bg-background">
      {/* Background */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 jointlly-grid opacity-35" />
      
      {/* Glow effects */}
      <motion.div
        className="absolute top-1/2 left-1/4 w-96 h-96 rounded-full bg-glow-gradient blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-1/2 right-1/4 w-80 h-80 rounded-full blur-3xl"
        style={{ background: "var(--gradient-accent-glow)" }}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            <span className="text-foreground">Ready to Build</span>
            <br />
            <span className="text-accent">With Confidence</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-1">
            Join thousands of landowners and builders who trust Jointlly for transparent, AI-powered real estate decisions.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-stretch justify-center gap-4 sm:gap-6 md:max-w-2xl mx-auto"
        >
          {/* Landowner Button */}
          <div onClick={handleLandownerClick} className="w-full md:w-80 block cursor-pointer min-h-[44px]">
            <motion.div
              className="relative group h-full"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-300 via-emerald-200 to-lime-200 opacity-55 blur-xl group-hover:opacity-80 transition-opacity duration-300" />
              <div className="relative h-full min-h-[120px] sm:min-h-[140px] md:h-40 px-4 sm:px-6 py-5 sm:py-6 rounded-2xl flex items-center justify-between gap-3 sm:gap-4 border border-emerald-300/70 bg-emerald-100 text-emerald-950 shadow-[0_0_30px_rgba(16,185,129,0.35)] group-hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all duration-300 w-full">
                <div className="text-left">
                  <h3 className="text-xl font-semibold text-emerald-950">Landowner</h3>
                  <p className="text-sm text-emerald-900/75">Property Owner</p>
                </div>
                <motion.svg
                  className="w-6 h-6 text-emerald-700 ml-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </motion.svg>
              </div>
            </motion.div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-20 bg-border" />
          <div className="block md:hidden h-px w-20 bg-border mx-auto" />

          {/* Builder Button */}
          <div onClick={handleBuilderClick} className="w-full md:w-80 block cursor-pointer min-h-[44px]">
            <motion.div
              className="relative group h-full"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-300 via-emerald-200 to-lime-200 opacity-55 blur-xl group-hover:opacity-80 transition-opacity duration-300" />
              <div className="relative h-full min-h-[120px] sm:min-h-[140px] md:h-40 px-4 sm:px-6 py-5 sm:py-6 rounded-2xl flex items-center justify-between gap-3 sm:gap-4 border border-emerald-300/70 bg-emerald-100 text-emerald-950 shadow-[0_0_30px_rgba(16,185,129,0.35)] group-hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all duration-300 w-full">
                <div className="text-left">
                  <h3 className="text-xl font-semibold text-emerald-950">Construction Company</h3>
                  <p className="text-sm text-emerald-900/75">Builder</p>
                </div>
                <motion.svg
                  className="w-6 h-6 text-emerald-700 ml-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </motion.svg>
              </div>
            </motion.div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default CTASection;
