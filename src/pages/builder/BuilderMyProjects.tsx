import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Compass, Loader2, MapPin, Ruler, SquareChartGantt, TrafficCone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BuilderPortfolioProjectCard } from "@/components/BuilderPortfolioProjectCard";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import {
  getProfessionalMatches,
  getProfessionalProfile,
  getProjectMarketplace,
  listProfessionalPortfolio,
  type MatchResponse,
  type ProjectMarketplaceCard,
  type ProfessionalPortfolioItem,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type BuilderMyProjectsProps = {
  /** When true, hide full dashboard header (used inside Account > Projects). */
  embedded?: boolean;
};

const BuilderMyProjects = ({ embedded = false }: BuilderMyProjectsProps) => {
  const { isAuthenticated, user } = useAuth();
  const [items, setItems] = useState<ProfessionalPortfolioItem[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<
    Array<{ match: MatchResponse; project: ProjectMarketplaceCard }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated || user?.userType !== "builder") {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [portfolio, profile, projectRows] = await Promise.all([
          listProfessionalPortfolio(),
          getProfessionalProfile(),
          getProjectMarketplace({ page: 1, page_size: 100 }),
        ]);
        const matchRows = await getProfessionalMatches(profile.id, 300);
        const projectById = new Map(projectRows.map((row) => [row.project_id, row]));
        const chosen = matchRows
          .filter((m) => m.express_interest_builder)
          .map((m) => ({ match: m, project: projectById.get(m.project_id) }))
          .filter((row): row is { match: MatchResponse; project: ProjectMarketplaceCard } => Boolean(row.project));
        if (!cancelled) {
          setItems(portfolio);
          setSelectedProjects(chosen);
        }
      } catch (e) {
        if (!cancelled) {
          setItems([]);
          setSelectedProjects([]);
          setError(e instanceof Error ? e.message : "Could not load projects");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.userType]);

  const titleClass = embedded
    ? "text-2xl font-bold text-foreground"
    : "text-4xl font-bold text-foreground";

  return (
    <div className={embedded ? "min-h-0" : "w-full"}>
      {!embedded && (
        <header className="bg-primary text-primary-foreground border-b border-primary/20">
          <div className="max-w-7xl mx-auto w-full py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <Link to="/" className="text-xl font-bold">
                  Jointlly
                </Link>
                <nav className="hidden md:flex items-center gap-6">
                  <Link
                    to="/builder/dashboard"
                    className="text-sm font-medium hover:text-primary-foreground/90 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/builder/matches"
                    className="text-sm font-medium hover:text-primary-foreground/90 transition-colors"
                  >
                    Your matches
                  </Link>
                  <Link
                    to="/builder/marketplace"
                    className="text-sm font-medium hover:text-primary-foreground/90 transition-colors"
                  >
                    Opportunities
                  </Link>
                </nav>
              </div>
              <Link to="/builder/dashboard">
                <Button variant="outline" className="border-primary-foreground/60 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
          </div>
        </header>
      )}

      <main className={embedded ? "w-full" : "max-w-7xl mx-auto w-full py-8"}>
        <div className={embedded ? "mb-6" : "mb-8"}>
          <h1 className={titleClass}>Projects</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Your selected opportunity projects and portfolio projects are shown here.
          </p>
        </div>

        {!isAuthenticated || user?.userType !== "builder" ? (
          <p className="text-sm text-muted-foreground">Sign in as a builder to see your projects.</p>
        ) : loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            <span>Loading projects…</span>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <div className="space-y-8">
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Selected Landowner Projects</h2>
              {selectedProjects.length === 0 ? (
                <Card className="border-dashed border-border bg-muted/30">
                  <CardContent className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No selected landowner projects yet. Select a card in Opportunities to see it here.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {selectedProjects.map(({ match, project }) => {
                    const locationLine = [project.city, project.ward, project.landmark].filter(Boolean).join(" · ");
                    const formatType = (type: string) => type.replaceAll("_", " ");
                    const detailRows: Array<{ label: string; value: string; icon: React.ComponentType<{ className?: string }> }> = [
                      { label: "Project Type", value: formatType(project.project_type), icon: SquareChartGantt },
                      { label: "Maps", value: project.landmark || project.city || "Not specified", icon: MapPin },
                      ...(project.plot_area_sqft != null
                        ? [{ label: "Size", value: `${Math.round(project.plot_area_sqft).toLocaleString()} sq ft`, icon: Ruler }]
                        : []),
                      ...(project.intent ? [{ label: "Facing/Intent", value: project.intent, icon: Compass }] : []),
                      ...(project.road_width_ft != null
                        ? [{ label: "Road Width", value: `${project.road_width_ft} ft`, icon: TrafficCone }]
                        : []),
                      { label: "PID Verified", value: project.has_pid_verification ? "Yes" : "No", icon: BadgeCheck },
                      { label: "Tax Paid", value: project.tax_paid ? "Yes" : "No", icon: BadgeCheck },
                    ];

                    return (
                      <article
                        key={match.id}
                        className={cn(
                          "group flex flex-col overflow-hidden rounded-2xl border border-[#d9d4c8] bg-[#f8f7f3]",
                          "shadow-[0_2px_8px_rgba(16,24,40,0.08)]"
                        )}
                      >
                        <div className="border-b border-[#e7e3d9] bg-gradient-to-r from-[#1f4a36] via-[#2e6247] to-[#2f5f45] px-4 py-2.5 text-white">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="font-semibold tracking-tight text-[18px]">Property</h3>
                            <span className="rounded-full border border-[#c8a15a] bg-[#f4efe3] px-2.5 py-0.5 text-[11px] font-semibold text-[#2e6046]">
                              Selected
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2.5 px-4 py-3">
                          <p className="flex items-start gap-1.5 text-[12px] text-[#253629]">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#b0893d]" />
                            <span className="font-medium">{locationLine || "Location not specified"}</span>
                          </p>
                          <div className="h-px w-full bg-[#e7e3d9]" />
                          <div className="grid grid-cols-[120px_1fr] gap-x-2.5 gap-y-1 text-[12px]">
                            {detailRows.map((row) => (
                              <div key={row.label} className="contents">
                                <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                                  <row.icon className="h-3.5 w-3.5 text-[#b0893d]" />
                                  {row.label}
                                </p>
                                <p className="break-words border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b]">
                                  {row.value}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {items.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">Portfolio Projects</h2>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((p) => (
                    <BuilderPortfolioProjectCard key={p.id} project={p} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default BuilderMyProjects;
