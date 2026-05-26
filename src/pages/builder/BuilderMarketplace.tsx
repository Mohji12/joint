import { useEffect, useMemo, useState } from "react";
import { FolderSearch, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  confirmBuilderSelect,
  getBuilderPortfolioLatest,
  getProfessionalMatches,
  getProjectMarketplace,
  getProfessionalProfile,
  initiateBuilderSelect,
  isProfessionalProfileNotFoundError,
  verifyPaymentTransaction,
  type MatchResponse,
  type ProjectMarketplaceCard,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  applyClientOpportunityFilters,
  defaultClientFilters,
  type ClientFilterState,
  type OpportunitiesSortMode,
} from "@/components/opportunities";
import OpportunitiesPage from "./OpportunitiesPage";

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
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
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

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toDisplay(value: unknown) {
  const s = normalizeText(value);
  return s || "Not specified";
}

function LandownerSubmittedDetails({ project }: { project: ProjectMarketplaceCard }) {
  const jvPrefs = project.landowner_form_payload?.jv_preferences;
  const hasPresetIdea = normalizeText(jvPrefs?.has_preset_idea).toLowerCase();
  const presetIdeaExplain = normalizeText(jvPrefs?.preset_idea_explain);
  const payload = project.landowner_form_payload || {};
  const projectIntent = payload.project_intent || {};
  const feasibility = payload.feasibility || {};
  const verification = payload.verification || {};
  const poc = payload.point_of_contact || {};
  const interior = payload.interior_preferences || {};
  const reconstruction = payload.reconstruction_preferences || {};
  const contract = payload.contract_preferences || {};

  return (
    <div className="landowner-submitted-details">
      <p style={{ fontWeight: 600, marginBottom: "0.35rem", color: "#2a3e30" }}>Landowner submitted details</p>
      {project.project_type === "JV_JD" && (
        <>
          <p style={{ marginTop: "0.25rem", color: "#27342b" }}>
            Preset idea:{" "}
            <span style={{ fontWeight: 600 }}>
              {hasPresetIdea === "yes" ? "Yes" : hasPresetIdea === "no" ? "No" : "Not specified"}
            </span>
          </p>
          <p style={{ marginTop: "0.25rem", color: "#27342b" }}>
            Idea details: <span style={{ fontWeight: 600 }}>{toDisplay(presetIdeaExplain)}</span>
          </p>
          <p style={{ marginTop: "0.25rem", color: "#27342b" }}>
            Construction mode: <span style={{ fontWeight: 600 }}>{toDisplay(contract.construction_mode)}</span>
          </p>
        </>
      )}
      {project.project_type === "CONTRACT_CONSTRUCTION" && (
        <>
          <p style={{ marginTop: "0.25rem", color: "#27342b" }}>
            Construction mode: <span style={{ fontWeight: 600 }}>{toDisplay(contract.construction_mode)}</span>
          </p>
          <p style={{ marginTop: "0.25rem", color: "#27342b" }}>
            Preferred timeline: <span style={{ fontWeight: 600 }}>{toDisplay(projectIntent.timeline)}</span>
          </p>
        </>
      )}
      {project.project_type === "INTERIOR" && (
        <>
          <p style={{ marginTop: "0.25rem", color: "#27342b" }}>
            Space type: <span style={{ fontWeight: 600 }}>{toDisplay(interior.space_type)}</span>
          </p>
          <p style={{ marginTop: "0.25rem", color: "#27342b" }}>
            Design style: <span style={{ fontWeight: 600 }}>{toDisplay(interior.design_style)}</span>
          </p>
          <p style={{ marginTop: "0.25rem", color: "#27342b" }}>
            Construction mode: <span style={{ fontWeight: 600 }}>{toDisplay(contract.construction_mode)}</span>
          </p>
        </>
      )}
      {project.project_type === "RECONSTRUCTION" && (
        <>
          <p style={{ marginTop: "0.25rem", color: "#27342b" }}>
            Existing condition:{" "}
            <span style={{ fontWeight: 600 }}>{toDisplay(reconstruction.current_condition)}</span>
          </p>
          <p style={{ marginTop: "0.25rem", color: "#27342b" }}>
            Rebuild intent: <span style={{ fontWeight: 600 }}>{toDisplay(reconstruction.rebuild_intent)}</span>
          </p>
          <p style={{ marginTop: "0.25rem", color: "#27342b" }}>
            Construction mode: <span style={{ fontWeight: 600 }}>{toDisplay(contract.construction_mode)}</span>
          </p>
        </>
      )}
      {project.project_type !== "CONTRACT_CONSTRUCTION" && (
        <>
          <p style={{ marginTop: "0.25rem", color: "#27342b" }}>
            FAR (submitted): <span style={{ fontWeight: 600 }}>{toDisplay(feasibility.far)}</span>
          </p>
          <p style={{ marginTop: "0.25rem", color: "#27342b" }}>
            PID number: <span style={{ fontWeight: 600 }}>{toDisplay(verification.pid_number)}</span>
          </p>
        </>
      )}
      {(() => {
        const po = poc as {
          has_poc?: boolean;
          name?: string;
          availability?: string;
          mobile?: string;
        } | null;
        const declined = po && typeof po === "object" && po.has_poc === false;
        const hasPocDetails =
          !!po &&
          (po.has_poc === true ||
            !!normalizeText(po.name) ||
            !!normalizeText(po.availability) ||
            !!normalizeText(po.mobile));
        if (declined) {
          return (
            <p style={{ marginTop: "0.25rem", color: "#27342b" }}>
              POC: <span style={{ fontWeight: 600 }}>No separate POC</span>
            </p>
          );
        }
        if (!hasPocDetails) return null;
        return (
          <>
            <p style={{ marginTop: "0.25rem", color: "#27342b" }}>
              POC name: <span style={{ fontWeight: 600 }}>{toDisplay(po?.name)}</span>
            </p>
            <p style={{ marginTop: "0.25rem", color: "#27342b" }}>
              POC availability: <span style={{ fontWeight: 600 }}>{toDisplay(po?.availability)}</span>
            </p>
          </>
        );
      })()}
    </div>
  );
}

export default function BuilderMarketplace() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [projects, setProjects] = useState<ProjectMarketplaceCard[]>([]);
  const [constructionTypeFilter, setConstructionTypeFilter] = useState("");
  const [availableTypes, setAvailableTypes] = useState<string[] | null>(null);
  const [autoTypeSet, setAutoTypeSet] = useState(false);
  const [clientFilters, setClientFilters] = useState<ClientFilterState>(() => defaultClientFilters());
  const [sortMode, setSortMode] = useState<OpportunitiesSortMode>("recommended");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const profile = await getProfessionalProfile();
        const portfolio = await getBuilderPortfolioLatest();
        const types = [
          portfolio.contract_construction ? "CONTRACT_CONSTRUCTION" : null,
          portfolio.joint_venture ? "JV_JD" : null,
          portfolio.interior ? "INTERIOR" : null,
          portfolio.renovation_repaint ? "RECONSTRUCTION" : null,
        ].filter(Boolean) as string[];
        if (active) setAvailableTypes(types);
        if (!autoTypeSet && constructionTypeFilter === "" && types.length > 0) {
          setConstructionTypeFilter(types[0]);
          setAutoTypeSet(true);
        }
        const [matchRows, projectRows] = await Promise.all([
          getProfessionalMatches(profile.id, 20),
          getProjectMarketplace({
            page: 1,
            page_size: 100,
            project_type: (constructionTypeFilter || (types[0] ?? "")) || undefined,
          }),
        ]);
        if (!active) return;
        setMatches(matchRows);
        setProjects(projectRows);
      } catch (e) {
        if (!active) return;
        if (isProfessionalProfileNotFoundError(e)) {
          setError(
            "Create your professional profile first (any builder form), then return to Opportunities."
          );
        } else {
          setError(e instanceof Error ? e.message : "Failed to load matched projects");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [constructionTypeFilter, autoTypeSet]);

  const matchByProjectId = useMemo(
    () => new Map(matches.map((m) => [m.project_id, m])),
    [matches]
  );

  const visibleProjects = useMemo(
    () => applyClientOpportunityFilters(projects, matchByProjectId, clientFilters),
    [projects, matchByProjectId, clientFilters]
  );

  const displayProjects = useMemo(() => {
    const list = [...visibleProjects];
    if (sortMode === "score") {
      list.sort((a, b) => {
        const sa = matchByProjectId.get(a.project_id)?.match_score ?? -1;
        const sb = matchByProjectId.get(b.project_id)?.match_score ?? -1;
        if (sb !== sa) return sb - sa;
        return (a.city || "").localeCompare(b.city || "", undefined, { sensitivity: "base" });
      });
    } else if (sortMode === "location") {
      list.sort((a, b) =>
        (a.city || "").localeCompare(b.city || "", undefined, { sensitivity: "base" })
      );
    }
    return list;
  }, [visibleProjects, sortMode, matchByProjectId]);

  const sizeFilterMid = (clientFilters.sizeMin + clientFilters.sizeMax) / 2;
  const selectedMatch = selectedProjectId ? matchByProjectId.get(selectedProjectId) : undefined;
  const selectedMatchPercent = Math.max(
    0,
    Math.min(100, Math.round(((selectedMatch?.match_score ?? 0) <= 1 ? (selectedMatch?.match_score ?? 0) * 100 : (selectedMatch?.match_score ?? 0))))
  );

  const handleClearFilters = () => {
    setConstructionTypeFilter("");
    setClientFilters(defaultClientFilters());
  };

  const handlePayAndConnect = async () => {
    if (!selectedProjectId) return;
    try {
      setIsPaying(true);
      const match = matchByProjectId.get(selectedProjectId);
      if (!match) {
        throw new Error("Unable to find match for selected project.");
      }

      const initiated = await initiateBuilderSelect(match.id);
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
          description: `Builder connect fee (match ${selectedMatchPercent}%)`,
          order_id: initiated.order_id,
          handler: resolve,
          theme: { color: "#F3B24A" },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled by user.")),
          },
        });
        rz.open();
      });

      // Validate order id matches the initiated order.
      if (paymentResponse.razorpay_order_id !== initiated.order_id) {
        throw new Error("Payment order mismatch. Please try again.");
      }

      await verifyPaymentTransaction({
        transaction_id: initiated.transaction_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
      });

      const event = await confirmBuilderSelect(match.id, initiated.transaction_id);
      const updatedMatch = event.match;
      setMatches((prev) => {
        const exists = prev.some((m) => m.id === updatedMatch.id);
        if (exists) {
          return prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m));
        }
        return [updatedMatch, ...prev];
      });
      setSelectedProjectId(null);
      if (!event.email_dispatched) {
        setError(
          "Project selected, but contact-sharing email could not be sent. Please check backend SMTP settings/logs."
        );
        return;
      }
      navigate("/builder/account/projects");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete payment selection");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full min-w-0 px-0 sm:px-0 md:px-6 lg:px-8 pb-8 md:pb-10 space-y-5">
      <OpportunitiesPage
        projects={projects}
        displayProjects={displayProjects}
        matchByProjectId={matchByProjectId}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
        availableTypes={availableTypes}
        constructionTypeFilter={constructionTypeFilter}
        onConstructionTypeChange={setConstructionTypeFilter}
        clientFilters={clientFilters}
        onClientFiltersChange={setClientFilters}
        onClearFilters={handleClearFilters}
        disabledConstruction={availableTypes !== null && availableTypes.length === 0}
        loading={loading}
        projectsLength={projects.length}
        visibleProjectsLength={visibleProjects.length}
        sizeFilterMid={sizeFilterMid}
        isPaying={isPaying}
        renderDetailsSlot={(project) => <LandownerSubmittedDetails project={project} />}
        onEvaluate={(projectId) => setSelectedProjectId(projectId)}
      />

      {!loading && error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {!loading && !error && visibleProjects.length === 0 && (
        <Card className="border-dashed border-border bg-card/80">
          <CardContent className="flex flex-col items-center text-center px-6 py-12 sm:py-14">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FolderSearch className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-semibold text-foreground">No opportunities match your filters</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
              Newly created landowner project cards will appear here. Try widening filters or check back later.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <Button asChild variant="default" className="gap-2">
                <Link to="/builder/matches">
                  <Users className="h-4 w-4" />
                  View matches &amp; opportunities
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/builder/dashboard">Back to dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={!!selectedProjectId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProjectId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm project acceptance</DialogTitle>
            <DialogDescription>
              Your connect fee is dynamically set by match score tier.
              Current match score: <strong>{selectedMatchPercent}%</strong>.
              On successful payment, contact-sharing emails will be sent to both registered email addresses.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedProjectId(null);
              }}
              disabled={isPaying}
            >
              Cancel
            </Button>
            <Button onClick={handlePayAndConnect} disabled={isPaying}>
              {isPaying ? "Processing…" : "Yes, accept project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
