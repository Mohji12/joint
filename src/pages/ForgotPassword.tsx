import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/api";
const appLogo = "/image/IMG-20260323-WA0012-removebg-preview.png";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!acceptedTerms) {
      setError(
        "You must accept the Terms & Conditions. Jointlly is an online facilitator platform and is not responsible for any disputes or escalations."
      );
      return;
    }

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await requestPasswordReset(email.trim());
      setMessage(response.message);
      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`);
      }, 800);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/90 via-green-50 to-teal-50/90" />
        <div className="absolute inset-0 jointlly-grid opacity-30" />

        <div className="relative z-10 max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 sm:mb-8 transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>

          <div className="glass-card rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 border border-glass-border">
            <div className="text-center mb-6 sm:mb-8">
              <div className="mb-3 sm:mb-4 flex justify-center">
                <img
                  src={appLogo}
                  alt="Jointlly"
                  className="h-16 sm:h-20 w-auto object-contain block"
                />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Forgot password</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Enter your email address and we'll send you an OTP to reset your password.
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive mb-4 p-3 rounded-lg bg-destructive/10">
                {error}
              </p>
            )}

            {message && (
              <p className="text-sm text-emerald-700 mb-4 p-3 rounded-lg bg-emerald-50">
                {message}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="mb-2 block">
                  Email Address *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`pl-10 ${error ? "border-destructive" : ""}`}
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span>
                  I accept the{" "}
                  <Link to="/legal/terms" className="text-primary underline underline-offset-2">
                    Terms &amp; Conditions
                  </Link>{" "}
                  and acknowledge that Jointlly is an online facilitator and not responsible for any disputes or
                  escalations between parties.
                </span>
              </label>

              <Button
                type="submit"
                size="lg"
                className="w-full btn-premium min-h-[44px]"
                disabled={submitting}
              >
                {submitting ? "Please wait..." : "Send OTP"}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ForgotPassword;

