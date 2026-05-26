import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

type ComingSoonProps = {
  title: string;
  description?: string;
  ctaHref?: string;
  ctaLabel?: string;
};

const ComingSoon = ({
  title,
  description = "This page is under preparation. Check back soon.",
  ctaHref = "/contact",
  ctaLabel = "Contact Support",
}: ComingSoonProps) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-background px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-2xl rounded-xl border border-border/60 bg-card p-6 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
          <div className="shrink-0 rounded-lg bg-[#F3B24A]/20 border border-[#F3B24A]/40 px-3 py-2 text-sm font-semibold text-foreground">
            Coming soon
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
          <Link
            to={ctaHref}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 text-primary underline hover:text-primary/90 rounded-md bg-background"
          >
            {ctaLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 text-muted-foreground hover:text-foreground rounded-md border border-border/60"
          >
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ComingSoon;

