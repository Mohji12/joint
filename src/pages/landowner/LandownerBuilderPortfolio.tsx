import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Building2, ChevronLeft, Loader2 } from "lucide-react";
import { getBuilderMarketplacePortfolio, type BuilderPortfolioLatest } from "@/lib/api";
import { BuilderPortfolioTypePanel } from "@/components/BuilderPortfolioPayloadView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type PortfolioTab = "contract" | "jv" | "interior" | "renovation";

const VALID_TABS: PortfolioTab[] = ["contract", "jv", "interior", "renovation"];

export default function LandownerBuilderPortfolio() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BuilderPortfolioLatest | null>(null);
  const locationState = location.state as { companyName?: string; defaultTab?: PortfolioTab } | null;
  const initialTab =
    locationState?.defaultTab && VALID_TABS.includes(locationState.defaultTab)
      ? locationState.defaultTab
      : "contract";
  const [tab, setTab] = useState<PortfolioTab>(initialTab);

  const builderName = locationState?.companyName || "Builder Profile";

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const rows = await getBuilderMarketplacePortfolio(id);
        if (!active) return;
        setData(rows);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Failed to load builder portfolio");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const availableCount = useMemo(() => {
    if (!data) return 0;
    return [data.contract_construction, data.joint_venture, data.interior, data.renovation_repaint].filter(Boolean)
      .length;
  }, [data]);

  useEffect(() => {
    if (!data) return;
    const has: Record<PortfolioTab, boolean> = {
      contract: !!data.contract_construction,
      jv: !!data.joint_venture,
      interior: !!data.interior,
      renovation: !!data.renovation_repaint,
    };
    if (!has[tab]) {
      const next = VALID_TABS.find((t) => has[t]);
      if (next) setTab(next);
    }
  }, [data, tab]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-[#5c6b5f]">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading builder details...
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#b0893d]">Opportunities</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-[#1a2e22]">
            <Building2 className="h-6 w-6 text-[#1f4a36]" />
            {builderName}
          </h1>
          <p className="mt-1 text-sm text-[#5c6b5f]">
            Submitted details by construction type (phone, email, and street-level address are not shown).{" "}
            {availableCount} of 4 profile types are available.
          </p>
        </div>
        <Link
          to="/landowner/marketplace"
          className="inline-flex items-center gap-1 rounded-lg border border-[#d9d4c8] bg-white px-3 py-2 text-sm font-medium text-[#1f4a36] hover:bg-[#f8f7f3]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as PortfolioTab)} className="w-full">
        <TabsList className="flex h-auto min-h-10 w-full flex-wrap justify-start gap-1 bg-muted/80 p-1.5">
          <TabsTrigger value="contract" className={cn("rounded-lg px-3 py-2 text-xs sm:text-sm")}>
            Contract construction
          </TabsTrigger>
          <TabsTrigger value="jv" className={cn("rounded-lg px-3 py-2 text-xs sm:text-sm")}>
            JV / JD
          </TabsTrigger>
          <TabsTrigger value="interior" className={cn("rounded-lg px-3 py-2 text-xs sm:text-sm")}>
            Interior
          </TabsTrigger>
          <TabsTrigger value="renovation" className={cn("rounded-lg px-3 py-2 text-xs sm:text-sm")}>
            Renovation / Repaint
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contract" className="mt-4">
          <BuilderPortfolioTypePanel title="Contract Construction" submission={data?.contract_construction ?? null} />
        </TabsContent>
        <TabsContent value="jv" className="mt-4">
          <BuilderPortfolioTypePanel title="JV / JD" submission={data?.joint_venture ?? null} />
        </TabsContent>
        <TabsContent value="interior" className="mt-4">
          <BuilderPortfolioTypePanel title="Interior" submission={data?.interior ?? null} />
        </TabsContent>
        <TabsContent value="renovation" className="mt-4">
          <BuilderPortfolioTypePanel title="Renovation / Repaint" submission={data?.renovation_repaint ?? null} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
