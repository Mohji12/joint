import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resendEmailOtp, verifyEmailOtp } from "@/lib/api";

const appLogo = "/image/IMG-20260323-WA0012-removebg-preview.png";

type Status = "idle" | "loading" | "success" | "error";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = useMemo(() => (searchParams.get("email") || "").trim(), [searchParams]);
  const userType = useMemo(() => {
    const raw = (searchParams.get("userType") || "builder").trim().toLowerCase();
    return raw === "landowner" ? "landowner" : "builder";
  }, [searchParams]);

  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (!email) {
      setStatus("error");
      setMessage("Missing email address. Please go back and sign up again.");
      return;
    }
    if (!otp.trim()) {
      setStatus("error");
      setMessage("Please enter the OTP sent to your email.");
      return;
    }

    setStatus("loading");
    setMessage(null);
    try {
      const response = await verifyEmailOtp(email, otp.trim());
      setMessage(response.message);
      setStatus("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed. Please try again.";
      setMessage(msg);
      setStatus("error");
    }
  };

  const handleGoToLogin = () => {
    navigate("/auth", { replace: true, state: { userType, authMode: "login" } });
  };

  const handleResendOtp = async () => {
    if (!email) {
      setStatus("error");
      setMessage("Missing email address. Please go back and sign up again.");
      return;
    }
    setResending(true);
    setMessage(null);
    try {
      const response = await resendEmailOtp(email);
      setMessage(response.message || "A new OTP has been sent to your email.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not resend OTP. Please try again.";
      setStatus("error");
      setMessage(msg);
    } finally {
      setResending(false);
    }
  };

  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const isError = status === "error";

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/90 via-green-50 to-teal-50/90" />
        <div className="absolute inset-0 jointlly-grid opacity-30" />

        <div className="relative z-10 max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 sm:mb-8 transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="glass-card rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 border border-glass-border text-center">
            <div className="mb-3 sm:mb-4 flex justify-center">
              <img
                src={appLogo}
                alt="Jointlly"
                className="h-16 sm:h-20 w-auto object-contain block"
              />
            </div>

            {isLoading && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F3B24A]" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Verifying email...</h1>
                <p className="text-muted-foreground">
                  Please wait while we confirm your email address.
                </p>
              </>
            )}

            {isSuccess && (
              <>
                <div className="flex justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Email verified</h1>
                <p className="text-muted-foreground mb-4">
                  {message || "Your email has been verified successfully."}
                </p>
                <Button onClick={handleGoToLogin} className="btn-premium min-h-[44px]">
                  Go to login
                </Button>
              </>
            )}

            {status === "idle" && (
              <>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Enter OTP</h1>
                <p className="text-muted-foreground mb-5">
                  We sent a verification code to {email ? <span className="font-medium text-foreground">{email}</span> : "your email"}.
                </p>

                <div className="space-y-2 text-left">
                  <Label htmlFor="otp">OTP</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="min-h-[44px]"
                  />
                </div>

                {message && (
                  <p className="text-sm text-destructive mt-4 p-3 rounded-lg bg-destructive/10">
                    {message}
                  </p>
                )}

                <div className="mt-5 flex flex-col gap-2">
                  <Button onClick={handleVerify} className="btn-premium min-h-[44px]">
                    Verify
                  </Button>
                  <Button onClick={handleResendOtp} variant="outline" className="min-h-[44px]" disabled={resending}>
                    {resending ? "Sending OTP..." : "Resend OTP"}
                  </Button>
                  <Button onClick={handleGoToLogin} variant="outline" className="min-h-[44px]">
                    Back to login
                  </Button>
                </div>
              </>
            )}

            {isError && status !== "idle" && (
              <>
                <div className="flex justify-center mb-4">
                  <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Verification failed</h1>
                <p className="text-muted-foreground mb-4">
                  {message || "We could not verify your email. The OTP may have expired."}
                </p>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => setStatus("idle")} className="btn-premium min-h-[44px]">
                    Try again
                  </Button>
                  <Button onClick={handleGoToLogin} variant="outline" className="min-h-[44px]">
                    Back to login
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default VerifyEmail;

