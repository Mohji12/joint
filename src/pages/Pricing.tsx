import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle2 } from "lucide-react";

type GatekeeperRow = {
  category: string;
  payer: "Landowner" | "Professional";
  fee: string;
  notes?: string;
};

type SuccessFeeRow = {
  category: string;
  percentRange: string;
  tiers: { label: string; percent: string }[];
  payer: "Professional";
};

const gatekeeperPricing: GatekeeperRow[] = [
  {
    category: "Landowner entry",
    payer: "Landowner",
    fee: "₹99 (one-time)",
    notes: "Nominal entry fee for landowners.",
  },
  { category: "Interiors", payer: "Professional", fee: "₹1,499   ₹3,999" },
  { category: "Renovation/Repaint", payer: "Professional", fee: "₹1,999   ₹3,999" },
  { category: "Construction", payer: "Professional", fee: "₹3,999 (fixed)" },
  { category: "Joint Development", payer: "Professional", fee: "₹5,999   ₹9,999" },
];

const successFeePricing: SuccessFeeRow[] = [
  {
    category: "Construction",
    percentRange: "0.75% - 0.5%",
    tiers: [
      { label: "Deal > ₹5Cr", percent: "0.75%" },
      { label: "₹1Cr - ₹5Cr", percent: "0.6%" },
      { label: "Deal < ₹1Cr", percent: "0.5%" },
    ],
    payer: "Professional",
  },
  {
    category: "Joint Development",
    percentRange: "0.75% - 0.5%",
    tiers: [
      { label: "Deal > ₹5Cr", percent: "0.75%" },
      { label: "₹1Cr - ₹5Cr", percent: "0.6%" },
      { label: "Deal < ₹1Cr", percent: "0.5%" },
    ],
    payer: "Professional",
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 sm:pt-28 md:pt-32 pb-10 sm:pb-12 md:pb-16 overflow-hidden">
        <div className="absolute inset-0 jointlly-grid opacity-30" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              <span className="text-gradient-primary">Pricing</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Transparent fees for entry, matching, and successful outcomes. All amounts are in INR (₹).
            </p>
          </motion.div>
        </div>
      </section>

      {/* Gatekeeper fees */}
      <section className="relative py-10 sm:py-12 md:py-16">
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-black/5 border border-border/50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-foreground/80" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Gatekeeper (Entry) Fees</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                One-time entry fee (landowners) and category-based access fees (professionals).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {gatekeeperPricing.map((row) => (
              <motion.div
                key={row.category}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                viewport={{ once: true, amount: 0.25 }}
                className="glass-card p-5 sm:p-6 border border-glass-border"
              >
                <div className="space-y-3">
                  <h3 className="min-w-0 break-words pr-2 text-lg sm:text-xl font-semibold text-foreground">{row.category}</h3>
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Payer: <span className="text-foreground">{row.payer}</span>
                    </p>
                    <div className="text-base sm:text-lg font-bold text-foreground">{row.fee}</div>
                  </div>
                </div>
                {row.notes ? (
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{row.notes}</p>
                ) : null}
              </motion.div>
            ))}
          </div>

          <div className="mt-6 sm:mt-8 rounded-xl border border-border/60 bg-black/5 p-4 sm:p-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Gatekeeper fees for professionals may vary within the range based on the deal size.                                                                                     
            </p>
          </div>
        </div>
      </section>

      {/* Success fee */}
      <section className="relative py-10 sm:py-12 md:py-16">
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-black/5 border border-border/50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-foreground/80" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Success Fees</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Applies only where enabled (Construction and Joint Development).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {successFeePricing.map((row) => (
              <motion.div
                key={row.category}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                viewport={{ once: true, amount: 0.25 }}
                className="glass-card p-5 sm:p-6 border border-glass-border"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground">{row.category}</h3>
                    <p className="text-sm text-muted-foreground mt-1">Range: {row.percentRange}</p>
                  </div>
                  <div className="text-sm text-muted-foreground text-right">
                    <span className="font-medium text-foreground">Payer</span>
                    <div>{row.payer}</div>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  {row.tiers.map((t) => (
                    <div
                      key={t.label}
                      className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-black/5 px-3 py-2"
                    >
                      <span className="text-sm text-muted-foreground">{t.label}</span>
                      <span className="text-sm font-semibold text-foreground">{t.percent}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <p className="mt-6 sm:mt-8 text-xs sm:text-sm text-muted-foreground">
            Note: Final payable amounts may depend on deal value tiers and specific workflow rules in the platform.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;

