import { useEffect, useState } from "react";
import {
  Compass,
  HardHat,
  Home,
  Loader2,
  MapPin,
  MapPinned,
  RefreshCw,
  Ruler,
  SquareChartGantt,
  TrafficCone,
  CalendarDays,
  BadgeCheck,
} from "lucide-react";
import { listLandownerProjects, listLandownerProperties, type ProjectResponse, type PropertyResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function formatSize(p: PropertyResponse): string | null {
  if (p.width_ft == null && p.length_ft == null) return null;
  return `${[p.width_ft, p.length_ft].filter((v) => v != null).join(" × ")} ft`;
}

function formatFacings(p: PropertyResponse): string | null {
  if (!p.facings || !p.facings.length) return null;
  return p.facings.join(", ");
}

function formatProjectType(projectType: string): string {
  return projectType.replaceAll("_", " ");
}

export default function LandownerAccountProperties() {
  const [items, setItems] = useState<PropertyResponse[]>([]);
  const [projectsByPropertyId, setProjectsByPropertyId] = useState<Record<string, ProjectResponse[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const [properties, projects] = await Promise.all([
        listLandownerProperties(),
        listLandownerProjects(),
      ]);
      setItems(properties);
      const grouped = projects.reduce<Record<string, ProjectResponse[]>>((acc, project) => {
        if (!acc[project.property_id]) acc[project.property_id] = [];
        acc[project.property_id].push(project);
        return acc;
      }, {});
      setProjectsByPropertyId(grouped);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading properties…
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">{error}</p>
          <Button type="button" variant="outline" size="sm" onClick={load} className="gap-2 shrink-0">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed border-border">
        <CardHeader>
          <CardTitle className="text-lg">No properties yet</CardTitle>
          <CardDescription>
            Add a property when you start a landowner flow (contract construction, JV, etc.). Saved properties
            will show up here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="secondary" onClick={load} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={load} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((p) => {
          const relatedProjects = projectsByPropertyId[p.id] || [];
          const latestProject = relatedProjects
            .slice()
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
          const detailRows: Array<{ label: string; value: string; icon: React.ComponentType<{ className?: string }> }> = [
            ...(latestProject?.project_type
              ? [{ label: "Project Type", value: formatProjectType(latestProject.project_type), icon: SquareChartGantt }]
              : []),
            ...(p.google_maps_pin ? [{ label: "Maps", value: p.google_maps_pin, icon: MapPinned }] : []),
            ...(formatSize(p) ? [{ label: "Size", value: formatSize(p) as string, icon: Ruler }] : []),
            ...(p.facing ? [{ label: "Facing", value: p.facing, icon: Compass }] : []),
            ...(p.road_width_ft != null ? [{ label: "Road Width", value: `${p.road_width_ft} ft`, icon: TrafficCone }] : []),
            { label: "Corner Plot", value: p.is_corner_plot ? "Yes" : "No", icon: HardHat },
            ...(formatFacings(p) ? [{ label: "Corner Facings", value: formatFacings(p) as string, icon: HardHat }] : []),
            ...(p.pid_number ? [{ label: "PID", value: p.pid_number, icon: BadgeCheck }] : []),
            ...(p.khatha_type ? [{ label: "Khatha Type", value: p.khatha_type, icon: BadgeCheck }] : []),
            ...(p.e_khatha_status ? [{ label: "E-Khatha", value: p.e_khatha_status, icon: BadgeCheck }] : []),
            { label: "Tax Paid", value: p.tax_paid ? "Yes" : "No", icon: BadgeCheck },
            ...(p.latitude != null && p.longitude != null
              ? [{ label: "Coordinates", value: `${p.latitude}, ${p.longitude}`, icon: MapPinned }]
              : []),
            ...(p.created_at ? [{ label: "Created", value: new Date(p.created_at).toLocaleDateString(), icon: CalendarDays }] : []),
          ];

          return (
            <Card
              key={p.id}
              className="group overflow-hidden rounded-2xl border border-[#d9d4c8] bg-[#f8f7f3] shadow-[0_2px_8px_rgba(16,24,40,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(16,24,40,0.14)]"
            >
              <CardHeader className="space-y-0 border-b border-[#e7e3d9] bg-gradient-to-r from-[#1f4a36] via-[#2e6247] to-[#2f5f45] px-4 py-2.5 text-white">
                <div className="flex items-center gap-3">
                  <CardTitle className="flex items-center gap-2 font-semibold tracking-tight text-white">
                    <Home className="h-4 w-4" />
                    <span className="text-[20px] leading-none">{p.name?.trim() || "Property"}</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5 px-4 py-3">
                <CardDescription className="flex items-start gap-1.5 text-[12px] text-[#253629]">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#b0893d]" />
                  <span className="font-medium">
                    {[p.city, p.ward].filter(Boolean).join(" · ")}
                    {p.landmark ? ` · ${p.landmark}` : ""}
                  </span>
                </CardDescription>
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
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
