import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Hammer, Handshake, Palette, Wrench, Plus, FileText, CheckCircle2, ArrowRight, Users, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandownerProjectCard } from "@/components/LandownerProjectCard";
import { createPaymentOrder, getMyTransactions, verifyPaymentTransaction } from "@/lib/api";

type RazorpaySuccessPayload = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessPayload) => void;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayInstance = {
  open: () => void;
};

type RazorpayConstructor = new (options: RazorpayCheckoutOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

let razorpayScriptPromise: Promise<void> | null = null;

function ensureRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay checkout is only available in browser."));
  }
  if (window.Razorpay) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout SDK."));
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

const quickActions = [
  { path: "/landowner/contract-construction", label: "Contract construction", icon: Hammer, desc: "I need a professional team to construct.", color: "bg-green-500" },
  { path: "/landowner/joint-venture", label: "Joint venture / JD", icon: Handshake, desc: "Explore JV/JD opportunities.", color: "bg-green-600" },
  { path: "/landowner/interior", label: "Interior architecture", icon: Palette, desc: "Find an interior design professional.", color: "bg-green-500" },
  { path: "/landowner/reconstruction", label: "Renovation / repaint", icon: Wrench, desc: "Repairs or improvements to my space.", color: "bg-green-600" },
];

const LandownerDashboard = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingEntryFee, setLoadingEntryFee] = useState(true);
  const [entryFeePaid, setEntryFeePaid] = useState(false);
  const [payingEntryFee, setPayingEntryFee] = useState(false);
  const [entryFeeError, setEntryFeeError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("landownerProjects");
    if (stored) {
      setProjects(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const txns = await getMyTransactions();
        if (cancelled) return;
        const hasSuccessEntry = txns.some(
          (t) => t.transaction_type === "LANDOWNER_ENTRY" && t.status === "SUCCESS"
        );
        setEntryFeePaid(hasSuccessEntry);
      } catch (e) {
        if (!cancelled) {
          setEntryFeeError(e instanceof Error ? e.message : "Failed to load payment status.");
        }
      } finally {
        if (!cancelled) setLoadingEntryFee(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePayEntryFee = async () => {
    try {
      setPayingEntryFee(true);
      setEntryFeeError(null);
      const initiated = await createPaymentOrder({
        amount: 99,
        transaction_type: "LANDOWNER_ENTRY",
        currency: "INR",
      });
      if (!initiated.razorpay_key_id) {
        throw new Error("Payment gateway key is unavailable. Please contact support.");
      }

      await ensureRazorpayScript();
      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not available. Please refresh and try again.");
      }

      const paymentResponse = await new Promise<RazorpaySuccessPayload>((resolve, reject) => {
        const rz = new window.Razorpay({
          key: initiated.razorpay_key_id,
          amount: Math.round(initiated.amount * 100),
          currency: initiated.currency,
          name: "Jointlly",
          description: "Landowner one-time entry fee",
          order_id: initiated.order_id,
          handler: resolve,
          theme: { color: "#1A5C35" },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled by user.")),
          },
        });
        rz.open();
      });

      if (paymentResponse.razorpay_order_id !== initiated.order_id) {
        throw new Error("Payment order mismatch. Please try again.");
      }

      await verifyPaymentTransaction({
        transaction_id: initiated.transaction_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
      });
      setEntryFeePaid(true);
    } catch (e) {
      setEntryFeeError(e instanceof Error ? e.message : "Failed to complete entry fee payment.");
    } finally {
      setPayingEntryFee(false);
    }
  };

  const getProjectStatus = (type: string) => {
    return projects.some(p => p.type === type);
  };

  const stats = [
    { label: "Active Projects", value: projects.length, icon: FileText, color: "text-green-600" },
    { label: "Published", value: projects.length, icon: CheckCircle2, color: "text-green-500" },
    { label: "Your matches", value: 0, icon: Users, color: "text-green-600" },
  ];

  if (loadingEntryFee) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Checking entry fee status...
      </div>
    );
  }

  if (!entryFeePaid) {
    return (
      <div className="min-h-0 bg-background flex flex-col">
        <main className="max-w-3xl mx-auto w-full px-6 py-12">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-foreground mb-2">Landowner entry fee required</h1>
            <p className="text-muted-foreground mb-6">
              Complete the one-time <strong>₹99</strong> landowner entry fee to unlock dashboard, project posting, and marketplace access.
            </p>
            <div className="flex items-center gap-3">
              <Button onClick={() => void handlePayEntryFee()} disabled={payingEntryFee}>
                {payingEntryFee ? "Opening Razorpay..." : "Pay ₹99 and Continue"}
              </Button>
              <Link to="/landowner/account/payments" className="text-sm text-primary hover:underline">
                View payment history
              </Link>
            </div>
            {entryFeeError && (
              <p className="mt-4 text-sm text-destructive">{entryFeeError}</p>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-0 bg-background flex flex-col">
      {/* Professional Header */}
      <header className="sticky top-0 z-30 bg-black text-white border-b border-gray-800 shrink-0 lg:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-xl font-bold">Jointlly</Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link to="/landowner/dashboard" className="text-sm font-medium hover:text-green-400 transition-colors">Dashboard</Link>
                <Link to="/landowner/matches" className="text-sm font-medium hover:text-green-400 transition-colors">Your matches</Link>
                <Link to="/landowner/marketplace" className="text-sm font-medium hover:text-green-400 transition-colors">Opportunities</Link>
              </nav>
            </div>
            <Link to="/landowner/options">
              <Button className="btn-navbar gap-2">
                <Plus className="w-4 h-4" />
                Post Listing
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full pt-4 pb-8 sm:pt-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">Dashboard</h1>
          <p className="text-gray-600">Manage your requests and projects. Create a new request or view published projects.</p>
        </div>

        {/* Instruction banner */}
        <section className="mb-8">
          <div className="rounded-xl border border-gray-200 bg-white p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-black">Create your opportunity listing</h2>
                <p className="text-sm text-gray-600">
                  To publish your request on Opportunities, fill the form (contract construction, JV/JD, interior, or renovation). Your card will appear for builders to match with you.
                </p>
              </div>
            </div>
            <Link to="/landowner/options">
              <Button className="w-full md:w-auto gap-2">
                Fill the form
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                <span className="text-2xl font-bold text-black">{stat.value}</span>
              </div>
              <p className="text-sm text-gray-600">{stat.label}</p>
              {stat.label === "Matches" && (
                <Link to="/landowner/matches" className="text-sm font-medium text-green-600 hover:text-green-700 mt-2 inline-block">View matches</Link>
              )}
            </motion.div>
          ))}
        </div>

        {/* Featured Projects Section */}
        {projects.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">Featured Projects</h2>
              <Link to="/landowner/my-projects" className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.slice(0, 6).map((project, index) => (
                <LandownerProjectCard key={index} project={project} index={index} variant="compact" />
              ))}
            </div>
          </section>
        )}

        {/* New Request Section */}
        <section>
          <h2 className="text-2xl font-bold text-black mb-6">Create New Request</h2>
          <p className="text-gray-600 mb-6">Choose the type of request you want to create.</p>
          
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, i) => {
              const isCompleted = getProjectStatus(action.path.split("/").pop() || "");
              return (
                <Link key={action.path} to={action.path} className="block h-full">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className={`bg-white border-2 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer h-full min-h-[220px] flex flex-col ${
                      isCompleted ? "border-green-500" : "border-gray-200 hover:border-green-500"
                    }`}
                  >
                    <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-black mb-2 line-clamp-2">{action.label}</h3>
                    <p className="text-sm text-gray-600 mb-4 flex-1 line-clamp-3">{action.desc}</p>
                    {isCompleted && (
                      <div className="flex items-center gap-2 text-sm text-green-600 mt-auto">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Completed</span>
                      </div>
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandownerDashboard;
