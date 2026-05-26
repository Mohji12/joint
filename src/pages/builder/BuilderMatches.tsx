import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, FileText, Loader2, Check, X } from "lucide-react";
import {
  getProfessionalProfile,
  getProfessionalMatches,
  acceptMatch,
  rejectMatch,
  isProfessionalProfileNotFoundError,
  type MatchResponse,
} from "@/lib/api";
import { Button } from "@/components/ui/button";

const BuilderMatches = () => {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingMatchId, setActingMatchId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const profile = await getProfessionalProfile();
        if (cancelled) return;
        setProfileId(profile.id);
        const list = await getProfessionalMatches(profile.id, 10);
        if (cancelled) return;
        setMatches(list);
      } catch (e) {
        if (!cancelled) {
          if (isProfessionalProfileNotFoundError(e)) {
            setError(null);
          } else {
            setError(e instanceof Error ? e.message : "Failed to load");
          }
          setProfileId(null);
          setMatches([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAccept = async (matchId: string) => {
    setActingMatchId(matchId);
    try {
      await acceptMatch(matchId);
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, status: "ACCEPTED" as const } : m))
      );
    } finally {
      setActingMatchId(null);
    }
  };

  const handleReject = async (matchId: string) => {
    setActingMatchId(matchId);
    try {
      await rejectMatch(matchId);
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
    } finally {
      setActingMatchId(null);
    }
  };

  const pendingMatches = matches.filter((m) => m.status === "PENDING");

  return (
    <div className="w-full overflow-x-hidden">
      <section className="relative py-12 md:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 via-background to-background" />
        <div className="relative z-10 max-w-5xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Matches & <span className="text-gradient-primary">Opportunities</span>
            </h1>
            <p className="text-muted-foreground">
              Landowner requests that match your profile, location, and expertise.
            </p>
          </motion.div>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card rounded-2xl p-8 border border-glass-border flex items-center justify-center gap-3"
            >
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Loading matches…</span>
            </motion.div>
          )}

          {!loading && (error || !profileId) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-8 border border-glass-border text-center"
            >
              <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-2">No profile yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Submit at least one profile (Contract construction, JV/JD, Interior, or Renovation/Repaint) to see landowner requests that match your capabilities.
              </p>
              {error && (
                <p className="text-destructive text-sm mb-4" role="alert">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/builder/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg bg-accent text-accent-foreground px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors"
                >
                  Go to Dashboard
                </Link>
                <Link
                  to="/builder/contract-construction"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Submit profile
                </Link>
              </div>
            </motion.div>
          )}

          {!loading && profileId && pendingMatches.length === 0 && matches.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-8 border border-glass-border text-center"
            >
              <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-2">No matches yet</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                We will show matching landowner projects once they are available. Keep your profile updated.
              </p>
              <Link to="/builder/dashboard" className="inline-block mt-4 text-accent hover:underline">
                Go to Dashboard
              </Link>
            </motion.div>
          )}

          {!loading && profileId && pendingMatches.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold text-foreground">Your matches</h2>
              <ul className="space-y-4">
                {pendingMatches.map((match) => (
                  <li
                    key={match.id}
                    className="glass-card rounded-xl p-6 border border-glass-border flex flex-wrap items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Match score: <span className="font-medium text-foreground">{Math.round(match.match_score)}</span>
                        {match.estimated_cost != null && (
                          <> · Est. cost: ₹{(match.estimated_cost / 1_00_000).toFixed(1)}L</>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Project ID: {match.project_id.slice(0, 8)}…
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(match.id)}
                        disabled={actingMatchId === match.id}
                      >
                        {actingMatchId === match.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAccept(match.id)}
                        disabled={actingMatchId === match.id}
                      >
                        {actingMatchId === match.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Accept
                          </>
                        )}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              {matches.some((m) => m.status === "ACCEPTED" || m.status === "REJECTED") && (
                <p className="text-sm text-muted-foreground">
                  You have accepted or rejected some matches. View your dashboard for next steps.
                </p>
              )}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default BuilderMatches;
