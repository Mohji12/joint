import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Hammer, Handshake, Loader2, Palette, Paintbrush, Star } from "lucide-react";
import {
  getBuilderMarketplace,
  getBuilderMarketplacePortfolio,
  getProjectMatches,
  landownerClearMatchSelection,
  landownerSelectMatch,
  listLandownerProperties,
  listLandownerProjects,
  type BuilderMarketplaceCard,
  type BuilderMarketplacePortfolioPreview,
  type BuilderPortfolioLatest,
  type MatchResponse,
} from "@/lib/api";
import { BuilderPortfolioTypePanel } from "@/components/BuilderPortfolioPayloadView";
import { PortfolioTypeSummaryCard } from "@/components/PortfolioTypeSummaryCard";
import { getMatchTier, MatchBadge } from "@/components/opportunities";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Backend `ProjectType` → builder `CapabilityType` (marketplace filter). */
const ALL_BUILDER_CAPABILITIES = ["CONSTRUCTION", "JV_JD", "INTERIOR", "RECONSTRUCTION"] as const;

function projectTypeToCapability(projectType: string): string | null {
  const map: Record<string, string> = {
    CONTRACT_CONSTRUCTION: "CONSTRUCTION",
    JV_JD: "JV_JD",
    INTERIOR: "INTERIOR",
    RECONSTRUCTION: "RECONSTRUCTION",
  };
  return map[projectType] ?? null;
}

type LandownerPortfolioTab = "contract" | "jv" | "interior" | "renovation";

function projectTypeToPortfolioTab(projectType: string | undefined): LandownerPortfolioTab | undefined {
  if (!projectType) return undefined;
  const map: Record<string, LandownerPortfolioTab> = {
    CONTRACT_CONSTRUCTION: "contract",
    JV_JD: "jv",
    INTERIOR: "interior",
    RECONSTRUCTION: "renovation",
  };
  return map[projectType];
}

function profileNavState(companyName: string | undefined, projectType: string | undefined) {
  const defaultTab = projectTypeToPortfolioTab(projectType);
  return {
    ...(companyName ? { companyName } : {}),
    ...(defaultTab ? { defaultTab } : {}),
  };
}

const PORTFOLIO_TAB_META: Record<
  LandownerPortfolioTab,
  { icon: typeof Hammer; title: string }
> = {
  contract: { icon: Hammer, title: "Contract Construction" },
  jv: { icon: Handshake, title: "JV / JD" },
  interior: { icon: Palette, title: "Interior" },
  renovation: { icon: Paintbrush, title: "Renovation / Repaint" },
};

function displayStr(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.map(String).join(", ") : "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function pickPortfolioPreview(
  builder: BuilderMarketplaceCard,
  tab: LandownerPortfolioTab
): BuilderMarketplacePortfolioPreview | undefined {
  switch (tab) {
    case "contract":
      return builder.contract_portfolio_preview ?? undefined;
    case "jv":
      return builder.jv_portfolio_preview ?? undefined;
    case "interior":
      return builder.interior_portfolio_preview ?? undefined;
    case "renovation":
      return builder.renovation_portfolio_preview ?? undefined;
    default:
      return undefined;
  }
}

function landownerPortfolioLines(
  tab: LandownerPortfolioTab,
  builder: BuilderMarketplaceCard,
  preview: BuilderMarketplacePortfolioPreview | undefined,
  locationFallback: string
): [string, string][] {
  const company = preview?.company_name ?? builder.company_name;
  const exp =
    preview?.years_experience ??
    (builder.experience_years != null ? String(builder.experience_years) : "");
  const proj = preview?.projects_completed ?? "";
  const loc = preview?.location_summary ?? locationFallback;
  const upd = preview?.updated_at ? new Date(preview.updated_at).toLocaleDateString() : "";

  if (tab === "jv") {
    return [
      ["Company", displayStr(company)],
      ["Experience", displayStr(exp)],
      ["Locations", displayStr(loc)],
      ["Projects", displayStr(proj)],
      ["Updated", displayStr(upd)],
    ];
  }
  if (tab === "interior" || tab === "renovation") {
    return [
      ["Company", displayStr(company)],
      ["Experience", displayStr(exp)],
      ["Projects", displayStr(proj)],
      ["Service area", displayStr(loc)],
      ["Updated", displayStr(upd)],
    ];
  }
  return [
    ["Company", displayStr(company)],
    ["Experience", displayStr(exp)],
    ["Projects", displayStr(proj)],
    ["Location", displayStr(loc)],
    ["Updated", displayStr(upd)],
  ];
}

function builderOrShell(
  builder: BuilderMarketplaceCard | undefined,
  professionalId: string
): BuilderMarketplaceCard {
  return (
    builder ??
    ({
      id: professionalId,
      company_name: "",
      rera_experience: false,
      capability_types: [],
      recent_portfolio: [],
      location_preferences: [],
    } as BuilderMarketplaceCard)
  );
}

/** Capability rows + saved portfolio forms (previews), for landowners with multiple listing types. */
function portfolioSubmissionForTab(
  data: BuilderPortfolioLatest | null,
  tab: LandownerPortfolioTab
): BuilderPortfolioLatest["contract_construction"] {
  if (!data) return null;
  switch (tab) {
    case "contract":
      return data.contract_construction;
    case "jv":
      return data.joint_venture;
    case "interior":
      return data.interior;
    case "renovation":
      return data.renovation_repaint;
    default:
      return null;
  }
}

function builderCoversAnyRegisteredCapability(
  b: BuilderMarketplaceCard,
  registered: Set<string>
): boolean {
  const explicit = b.capability_types || [];
  const implied: string[] = [];
  if (b.contract_portfolio_preview?.has_data) implied.push("CONSTRUCTION");
  if (b.jv_portfolio_preview?.has_data) implied.push("JV_JD");
  if (b.interior_portfolio_preview?.has_data) implied.push("INTERIOR");
  if (b.renovation_portfolio_preview?.has_data) implied.push("RECONSTRUCTION");
  const cfp = b.contract_form_payload as Record<string, unknown> | null | undefined;
  if (
    !implied.includes("CONSTRUCTION") &&
    cfp &&
    typeof cfp.company_name === "string" &&
    cfp.company_name.trim().length > 0
  ) {
    implied.push("CONSTRUCTION");
  }
  const merged = new Set<string>([...explicit, ...implied]);
  for (const c of merged) {
    if (registered.has(c)) return true;
  }
  return false;
}

export default function LandownerMarketplace() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<
    Array<{ id: string; property_id: string; project_type: string }>
  >([]);
  const [propertyCityById, setPropertyCityById] = useState<Record<string, string>>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [builders, setBuilders] = useState<BuilderMarketplaceCard[]>([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [constructionTypeFilter, setConstructionTypeFilter] = useState("");
  const [freeTextFilter, setFreeTextFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchResponse | null>(null);
  const [matchToClear, setMatchToClear] = useState<MatchResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailProfessionalId, setDetailProfessionalId] = useState<string | null>(null);
  const [detailCompanyName, setDetailCompanyName] = useState<string | undefined>();
  const [detailPortfolio, setDetailPortfolio] = useState<BuilderPortfolioLatest | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const registeredCapabilitySet = useMemo(() => {
    const s = new Set<string>();
    for (const p of projects) {
      const c = projectTypeToCapability(p.project_type);
      if (c) s.add(c);
    }
    return s;
  }, [projects]);

  const hasAllRegisteredTypes =
    registeredCapabilitySet.size === ALL_BUILDER_CAPABILITIES.length;

  useEffect(() => {
    if (!constructionTypeFilter.trim()) return;
    if (registeredCapabilitySet.size === 0) return;
    if (!registeredCapabilitySet.has(constructionTypeFilter)) {
      setConstructionTypeFilter("");
    }
  }, [registeredCapabilitySet, constructionTypeFilter]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const [projectRows, propertyRows] = await Promise.all([
          listLandownerProjects(),
          listLandownerProperties(),
        ]);
        if (!active) return;
        const mappedProjects = projectRows.map((p) => ({
          id: p.id,
          property_id: p.property_id,
          project_type: p.project_type,
        }));
        setProjects(mappedProjects);
        const cityMap = propertyRows.reduce<Record<string, string>>((acc, prop) => {
          if (prop.city) acc[prop.id] = prop.city;
          return acc;
        }, {});
        setPropertyCityById(cityMap);
        if (projectRows.length > 0) {
          setSelectedProjectId(projectRows[0].id);
        } else {
          setLoading(false);
        }
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Failed to load opportunities data");
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const selectedProject = projects.find((p) => p.id === selectedProjectId);
        // Only send city when the landowner types it — property city was over-filtering builders
        // whose profile.city is empty or does not match spelling.
        const effectiveCity = locationFilter.trim() || undefined;

        const narrowCap =
          constructionTypeFilter.trim() && registeredCapabilitySet.has(constructionTypeFilter)
            ? constructionTypeFilter.trim()
            : "";

        // H-multi-cap: pass all registered capabilities to API so SQL pagination is not biased
        // toward random profiles that may share none of the landowner's types.
        let apiCapabilityTypes: string[] | undefined;
        if (narrowCap) {
          apiCapabilityTypes = [narrowCap];
        } else if (hasAllRegisteredTypes) {
          apiCapabilityTypes = undefined;
        } else {
          apiCapabilityTypes = [...registeredCapabilitySet];
        }

        const marketplaceParams = {
          page: 1,
          page_size: 100,
          city: effectiveCity,
          ...(apiCapabilityTypes?.length
            ? { capability_types: apiCapabilityTypes }
            : {}),
        };

        const [matchRows, builderRowsFirst] = await Promise.all([
          getProjectMatches(selectedProjectId, 3),
          getBuilderMarketplace(marketplaceParams),
        ]);
        if (!active) return;

        let builderRows = builderRowsFirst;
        // Typed location still too strict (spelling): second pass without city.
        if (builderRows.length === 0 && locationFilter.trim()) {
          builderRows = await getBuilderMarketplace({
            ...marketplaceParams,
            city: undefined,
          });
        }

        const matchProfIds = [...new Set(matchRows.map((m) => m.professional_id))];
        const missingForMatches = matchProfIds.filter((id) => !builderRows.some((b) => b.id === id));
        if (missingForMatches.length > 0) {
          try {
            const extra = await getBuilderMarketplace({
              professional_ids: missingForMatches,
              page_size: 40,
            });
            const seen = new Set(builderRows.map((b) => b.id));
            for (const b of extra) {
              if (!seen.has(b.id)) {
                seen.add(b.id);
                builderRows.push(b);
              }
            }
          } catch {
            /* best-effort: match cards still render with partial data */
          }
        }

        let registrationFiltered = builderRows;
        if (!hasAllRegisteredTypes && registeredCapabilitySet.size > 1) {
          registrationFiltered = builderRows.filter((b) =>
            builderCoversAnyRegisteredCapability(b, registeredCapabilitySet)
          );
        }

        const q = freeTextFilter.trim().toLowerCase();
        const filteredBuilders = !q
          ? registrationFiltered
          : registrationFiltered.filter((b) => {
              const previewHay = [
                b.contract_portfolio_preview,
                b.jv_portfolio_preview,
                b.interior_portfolio_preview,
                b.renovation_portfolio_preview,
              ]
                .filter(Boolean)
                .map((p) =>
                  [p!.company_name, p!.years_experience, p!.projects_completed, p!.location_summary]
                    .filter(Boolean)
                    .join(" ")
                )
                .join(" ");
              const haystack = [
                b.company_name,
                b.city,
                b.featured_project_name,
                (b.construction_project_types || []).join(" "),
                (b.capability_types || []).join(" "),
                (b.location_preferences || []).join(" "),
                previewHay,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
              return haystack.includes(q);
            });

        // H4 fix: do not require the match's professional to appear in filteredBuilders.
        // Matching is authoritative; marketplace list can omit them (city ILIKE, page limit, free text).
        const matchesKept = matchRows.filter((m) => {
          if (hasAllRegisteredTypes) return true;
          const prof = builderRows.find((b) => b.id === m.professional_id);
          if (!prof) return true;
          return builderCoversAnyRegisteredCapability(prof, registeredCapabilitySet);
        });

        const displayBuildersMap = new Map<string, BuilderMarketplaceCard>();
        for (const b of filteredBuilders) displayBuildersMap.set(b.id, b);
        for (const m of matchesKept) {
          if (!displayBuildersMap.has(m.professional_id)) {
            const raw = builderRows.find((b) => b.id === m.professional_id);
            if (raw) displayBuildersMap.set(raw.id, raw);
          }
        }
        const displayBuilders = [...displayBuildersMap.values()];

        setMatches(matchesKept);
        setBuilders(displayBuilders);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Failed to load top matches");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [
    selectedProjectId,
    projects,
    propertyCityById,
    locationFilter,
    constructionTypeFilter,
    freeTextFilter,
    registeredCapabilitySet,
    hasAllRegisteredTypes,
  ]);

  const builderMap = useMemo(() => new Map(builders.map((b) => [b.id, b])), [builders]);

  const selectedProjectForCards = useMemo(
    () => projects.find((p) => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );
  const activePortfolioTab = useMemo(
    () => projectTypeToPortfolioTab(selectedProjectForCards?.project_type) ?? "contract",
    [selectedProjectForCards?.project_type]
  );

  const preferredLocationsLine = (b: BuilderMarketplaceCard) => {
    const prefs = b.location_preferences?.filter(Boolean) ?? [];
    return prefs.length > 0 ? prefs.join(", ") : "—";
  };

  const openBuilderRegistrationDetail = async (professionalId: string, companyName?: string) => {
    setDetailProfessionalId(professionalId);
    setDetailCompanyName(companyName);
    setDetailOpen(true);
    setDetailPortfolio(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const rows = await getBuilderMarketplacePortfolio(professionalId);
      setDetailPortfolio(rows);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "Failed to load builder details");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeBuilderDetail = (open: boolean) => {
    if (!open) {
      setDetailOpen(false);
      setDetailProfessionalId(null);
      setDetailCompanyName(undefined);
      setDetailPortfolio(null);
      setDetailError(null);
    }
  };

  const confirmClearSelection = async () => {
    if (!matchToClear) return;
    try {
      setIsClearing(true);
      setError(null);
      const updated = await landownerClearMatchSelection(matchToClear.id);
      setMatches((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setMatchToClear(null);
      toast.success("Selection cleared — you can tap Select again to test the confirmation email.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to clear selection");
    } finally {
      setIsClearing(false);
    }
  };

  const confirmSelect = async () => {
    if (!selectedMatch) return;
    try {
      setIsSubmitting(true);
      const res = await landownerSelectMatch(selectedMatch.id);
      setMatches((prev) =>
        prev.map((m) =>
          m.id === selectedMatch.id
            ? { ...m, status: res.match.status, express_interest_landowner: res.match.express_interest_landowner }
            : m
        )
      );
      setSelectedMatch(null);
      if (res.email_dispatched) {
        toast.success(
          "The builder was emailed with your contact details. You'll get a confirmation email too—if either message doesn't show up, check spam or Promotions and ask the builder to check theirs."
        );
      } else {
        toast.warning(
          "Your choice was saved. We could not send email (check SMTP settings or your account email)."
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete selection");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Opportunities</h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Select a project to view matched construction companies. Builders are limited to the service types you have
          registered{hasAllRegisteredTypes ? " (all types — full directory)." : "."} Leave location empty to see all
          matching builders; use the location field only when you want to narrow by city or area.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <label className="block text-xs font-medium text-foreground/85 mb-1">Your project</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_type.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground/85 mb-1">
            Narrow by type {hasAllRegisteredTypes ? "(optional)" : "(your listings)"}
          </label>
          <select
            value={constructionTypeFilter}
            onChange={(e) => setConstructionTypeFilter(e.target.value)}
            disabled={registeredCapabilitySet.size === 0}
            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card disabled:opacity-60"
          >
            <option value="">
              {hasAllRegisteredTypes ? "All builder types" : "All my registered types"}
            </option>
            {registeredCapabilitySet.has("CONSTRUCTION") && (
              <option value="CONSTRUCTION">Contract construction</option>
            )}
            {registeredCapabilitySet.has("JV_JD") && <option value="JV_JD">JV / JD</option>}
            {registeredCapabilitySet.has("INTERIOR") && <option value="INTERIOR">Interior</option>}
            {registeredCapabilitySet.has("RECONSTRUCTION") && (
              <option value="RECONSTRUCTION">Renovation/Repaint</option>
            )}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground/85 mb-1">Location</label>
          <input
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            placeholder={
              selectedProjectForCards &&
              propertyCityById[selectedProjectForCards.property_id]
                ? `Optional — e.g. ${propertyCityById[selectedProjectForCards.property_id]}`
                : "Optional — city or area"
            }
            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground/85 mb-1">Free text</label>
          <input
            value={freeTextFilter}
            onChange={(e) => setFreeTextFilter(e.target.value)}
            placeholder="Company, area, capability..."
            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card"
          />
        </div>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading top matches...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && matches.length === 0 && builders.length === 0 && (
        <div className="text-sm text-muted-foreground">
          No matches or directory listings found. Try widening location or check back after more builders join.
        </div>
      )}
      {!loading && !error && matches.length === 0 && builders.length > 0 && (
        <div className="text-sm text-muted-foreground">
          No scored matches for this project yet. Showing professionals that match your registered service types (browse).
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {matches.length > 0
          ? matches.map((match) => {
              const raw = builderMap.get(match.professional_id);
              const builder = builderOrShell(raw, match.professional_id);
              const tab = activePortfolioTab;
              const meta = PORTFOLIO_TAB_META[tab];
              const preview = pickPortfolioPreview(builder, tab);
              const prefLine = preferredLocationsLine(builder);
              const locFb = prefLine !== "—" ? prefLine : displayStr(builder.city?.trim());
              const lines = landownerPortfolioLines(tab, builder, preview, locFb);
              const status = preview?.has_data ? "saved" : "empty";
              return (
                <div key={match.id} className="space-y-3 rounded-xl border border-border bg-card p-4">
                  <div className="flex justify-start items-center gap-2 flex-wrap">
                    <MatchBadge tier={getMatchTier(match.match_score)} />
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-1 text-xs text-accent-foreground border border-accent/30">
                      <Star className="h-3.5 w-3.5" />
                      {(match.match_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <PortfolioTypeSummaryCard
                    icon={meta.icon}
                    title={meta.title}
                    status={status}
                    lines={lines}
                    footerLabel="At a glance"
                  />
                  <p className="text-sm text-muted-foreground">
                    Estimated cost:{" "}
                    {match.estimated_cost
                      ? `₹${Math.round(match.estimated_cost).toLocaleString()}`
                      : "On request"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {match.express_interest_landowner
                      ? "You already confirmed this builder — we emailed them with your contact details for this project."
                      : "Select to confirm — we will email the builder with your contact details."}
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {match.express_interest_landowner ? (
                      <Button
                        variant="outline"
                        className="flex-1"
                        disabled={isClearing || isSubmitting}
                        onClick={() => setMatchToClear(match)}
                      >
                        Undo selection
                      </Button>
                    ) : (
                      <Button
                        className="flex-1"
                        disabled={isSubmitting}
                        onClick={() => setSelectedMatch(match)}
                      >
                        Select
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => void openBuilderRegistrationDetail(match.professional_id, builder.company_name)}
                    >
                      View detail
                    </Button>
                  </div>
                </div>
              );
            })
          : builders.map((builder) => {
              const tab = activePortfolioTab;
              const meta = PORTFOLIO_TAB_META[tab];
              const preview = pickPortfolioPreview(builder, tab);
              const prefLine = preferredLocationsLine(builder);
              const locFb = prefLine !== "—" ? prefLine : displayStr(builder.city?.trim());
              const lines = landownerPortfolioLines(tab, builder, preview, locFb);
              const status = preview?.has_data ? "saved" : "empty";
              const openProfile = () =>
                navigate(`/landowner/marketplace/builders/${builder.id}`, {
                  state: profileNavState(builder.company_name, selectedProjectForCards?.project_type),
                });
              return (
                <div key={builder.id} className="space-y-3 rounded-xl border border-border bg-card p-4">
                  <div className="flex justify-end">
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground border border-border">
                      Browse
                    </span>
                  </div>
                  <PortfolioTypeSummaryCard
                    icon={meta.icon}
                    title={meta.title}
                    status={status}
                    lines={lines}
                    footerLabel="At a glance"
                  />
                  <p className="text-sm text-muted-foreground">
                    Match score not assigned yet — use View detail for this listing type or open the full profile.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={() => void openBuilderRegistrationDetail(builder.id, builder.company_name)}
                    >
                      View detail
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={openProfile}>
                      Open full page
                    </Button>
                  </div>
                </div>
              );
            })}
      </div>

      <Dialog open={!!matchToClear} onOpenChange={(open) => !open && setMatchToClear(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Undo builder selection?</DialogTitle>
            <DialogDescription>
              This removes your confirmation for this match. You can use Select again to go through the confirmation
              step and resend the introduction email to the builder (if your backend is configured to send it).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMatchToClear(null)} disabled={isClearing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void confirmClearSelection()} disabled={isClearing}>
              {isClearing ? "Removing…" : "Yes, undo selection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedMatch} onOpenChange={(open) => !open && setSelectedMatch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share your contact with this builder?</DialogTitle>
            <DialogDescription>
              If you proceed, we record your choice and email the builder that you are interested in working with them
              on this project, and we include your name, email, and phone so they can reach you. You will receive a
              confirmation email as well.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedMatch(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={confirmSelect} disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Yes, proceed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={closeBuilderDetail}>
        <DialogContent className="flex max-h-[min(90vh,720px)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 space-y-1 border-b border-border px-6 py-4 text-left">
            <DialogTitle className="pr-8 text-lg">
              {detailCompanyName?.trim() || "Builder"} — {PORTFOLIO_TAB_META[activePortfolioTab].title}
            </DialogTitle>
            <DialogDescription className="text-left text-xs sm:text-sm">
              Registration fields for this construction type (sensitive contact and exact address fields may be
              withheld).
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {detailLoading && (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading details…
              </div>
            )}
            {!detailLoading && detailError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{detailError}</div>
            )}
            {!detailLoading && !detailError && detailPortfolio && (
              <BuilderPortfolioTypePanel
                title={PORTFOLIO_TAB_META[activePortfolioTab].title}
                submission={portfolioSubmissionForTab(detailPortfolio, activePortfolioTab)}
              />
            )}
          </div>
          <DialogFooter className="shrink-0 border-t border-border px-6 py-3">
            <Button
              variant="outline"
              onClick={() => closeBuilderDetail(false)}
            >
              Close
            </Button>
            {detailProfessionalId && (
              <Button
                onClick={() => {
                  const id = detailProfessionalId;
                  const name = detailCompanyName;
                  closeBuilderDetail(false);
                  navigate(`/landowner/marketplace/builders/${id}`, {
                    state: profileNavState(name, selectedProjectForCards?.project_type),
                  });
                }}
              >
                Open full profile
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


