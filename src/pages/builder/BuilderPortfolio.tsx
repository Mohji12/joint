import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Building2,
  Hammer,
  Handshake,
  Loader2,
  Paintbrush,
  Palette,
} from "lucide-react";
import { getBuilderPortfolioLatest, patchBuilderFormSubmission, type FormSubmissionDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  RESIDENTIAL_PACKAGES,
  COMMERCIAL_PACKAGES,
  INDUSTRIAL_PACKAGES,
  type ConstructionPricingType,
  getDefaultResidentialPackages,
  getDefaultCommercialPackages,
  getDefaultIndustrialPackages,
  buildPricingPayload,
} from "@/data/constructionPricingSpecs";
import { ConstructionPricingTable, type PricingRow } from "@/components/ConstructionPricingTable";
import { PortfolioTypeSummaryCard } from "@/components/PortfolioTypeSummaryCard";
import { BuilderComparisonTable } from "@/components/builder/BuilderComparisonTable";
import { PastProjectShowcaseCard } from "@/components/builder/PastProjectShowcaseCard";
import { buildComparisonColumnFromPayload } from "@/components/builder/builderComparisonUtils";
import { ContractConstructionPricingSection } from "@/components/builder/ContractConstructionPricingView";
import { RecentProjectsEditor, type RecentProject } from "@/components/builder/RecentProjectsEditor";

type ContractConstructionPayload = {
  company_name?: string;
  years_experience?: string;
  license_rera?: string;
  address?: string;
  project_types?: string[];
  preferred_location?: string;
  projects_completed?: string;
  project_details?: string;
  team_type?: string;
  subcontractor_scopes?: string[];
  subcontractor_other?: string;
  typical_size?: string;
  typical_size_other?: string;
  pricing?: Record<string, unknown>;
  project_image_urls?: string[];
  recent_projects?: RecentProject[];
};

function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    return (JSON.parse(text) as T) ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizePricingJson(pricingJson: string): Record<string, unknown> {
  const obj = safeJsonParse<Record<string, unknown>>(pricingJson.trim() || "{}", {});
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
  return obj;
}

function pricingRowsFromJson(
  pricingJson: string
): {
  residential: PricingRow[];
  commercial: PricingRow[];
  industrial: PricingRow[];
} {
  const pricing = normalizePricingJson(pricingJson);
  const residential = getDefaultResidentialPackages().map((r) => ({ ...r })) as PricingRow[];
  const commercial = getDefaultCommercialPackages().map((r) => ({ ...r })) as PricingRow[];
  const industrial = getDefaultIndustrialPackages().map((r) => ({ ...r })) as PricingRow[];

  const mergeType = (typeKey: "residential" | "commercial" | "industrial", rows: PricingRow[]) => {
    const byPkg = pricing[typeKey] as Record<string, Record<string, unknown>> | undefined;
    if (!byPkg || typeof byPkg !== "object") return;
    for (const row of rows) {
      const pkg = byPkg[String((row as any).id)] as Record<string, unknown> | undefined;
      if (!pkg || typeof pkg !== "object") continue;
      for (const [k, v] of Object.entries(pkg)) {
        if (typeof v === "string") (row as any)[k] = v;
      }
      const anyValue = Object.entries(row as any).some(
        ([k, v]) => !["id", "label", "selected"].includes(k) && typeof v === "string" && v.trim() !== ""
      );
      if (anyValue) (row as any).selected = true;
    }
  };

  mergeType("residential", residential);
  mergeType("commercial", commercial);
  mergeType("industrial", industrial);
  return { residential, commercial, industrial };
}

function PricingEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (nextJson: string) => void;
}) {
  const parsed = useMemo(() => pricingRowsFromJson(value), [value]);
  const [pricingType, setPricingType] = useState<ConstructionPricingType>("residential");
  const [residentialRows, setResidentialRows] = useState<PricingRow[]>(parsed.residential);
  const [commercialRows, setCommercialRows] = useState<PricingRow[]>(parsed.commercial);
  const [industrialRows, setIndustrialRows] = useState<PricingRow[]>(parsed.industrial);

  // Keep local rows in sync when value changes externally (e.g. Cancel/AutoEdit)
  useEffect(() => {
    setResidentialRows(parsed.residential);
    setCommercialRows(parsed.commercial);
    setIndustrialRows(parsed.industrial);
  }, [parsed.residential, parsed.commercial, parsed.industrial]);

  // Push structured edits back to JSON string
  useEffect(() => {
    const payload = buildPricingPayload(residentialRows as any, commercialRows as any, industrialRows as any);
    onChange(JSON.stringify(payload ?? {}, null, 2));
  }, [residentialRows, commercialRows, industrialRows, onChange]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Label>Pricing</Label>
        <div className="flex gap-2">
          {(["residential", "commercial", "industrial"] as const).map((t) => (
            <Button
              key={t}
              type="button"
              size="sm"
              variant={pricingType === t ? "default" : "outline"}
              className="rounded-xl"
              onClick={() => setPricingType(t)}
            >
              {t === "residential" ? "Residential" : t === "commercial" ? "Commercial" : "Industrial"}
            </Button>
          ))}
        </div>
      </div>

      {pricingType === "residential" ? (
        <ConstructionPricingTable
          constructionType="residential"
          packages={RESIDENTIAL_PACKAGES}
          rows={residentialRows}
          onRowsChange={setResidentialRows}
        />
      ) : null}
      {pricingType === "commercial" ? (
        <ConstructionPricingTable
          constructionType="commercial"
          packages={COMMERCIAL_PACKAGES}
          rows={commercialRows}
          onRowsChange={setCommercialRows}
        />
      ) : null}
      {pricingType === "industrial" ? (
        <ConstructionPricingTable
          constructionType="industrial"
          packages={INDUSTRIAL_PACKAGES}
          rows={industrialRows}
          onRowsChange={setIndustrialRows}
        />
      ) : null}
    </div>
  );
}

const cardShell =
  "overflow-hidden rounded-2xl border border-[#d9d4c8] bg-[#f8f7f3] shadow-[0_2px_12px_rgba(16,24,40,0.06)]";

const cardHeader =
  "border-b border-[#e7e3d9] bg-gradient-to-r from-[#1f4a36] via-[#2e6247] to-[#2f5f45] px-4 py-3 text-white";

function displayStr(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.map(String).join(", ") : "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function linesToList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function PortfolioEditToolbar({
  hasSubmission,
  editing,
  saving,
  saveError,
  onEdit,
  onCancel,
  onSave,
  formHref,
  formLinkLabel,
}: {
  hasSubmission: boolean;
  editing: boolean;
  saving: boolean;
  saveError: string | null;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  formHref: string;
  formLinkLabel: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {editing ? (
          <>
            <Button type="button" size="sm" onClick={onSave} disabled={saving} className="rounded-xl">
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={saving} className="rounded-xl">
              Cancel
            </Button>
          </>
        ) : hasSubmission ? (
          <Button
            type="button"
            size="sm"
            onClick={onEdit}
            className="rounded-xl bg-[#1f4a36] text-primary-foreground hover:bg-[#1f4a36]/90"
          >
            Edit here
          </Button>
        ) : null}
        <Button asChild variant="outline" size="sm" className="rounded-xl border-[#1f4a36]/30 text-[#1f4a36]">
          <Link to={formHref}>{formLinkLabel}</Link>
        </Button>
      </div>
      {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}
    </div>
  );
}

function SubmittedMeta({ createdAt }: { createdAt?: string }) {
  if (!createdAt) return null;
  let label = createdAt;
  try {
    label = new Date(createdAt).toLocaleString();
  } catch {
    /* keep raw */
  }
  return <p className="text-xs text-[#5c6b5f]">Last submitted: {label}</p>;
}

function TabEmpty({
  icon: Icon,
  title,
  description,
  to,
  cta,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  to: string;
  cta: string;
}) {
  return (
    <div className={cn(cardShell, "p-10 text-center")}>
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1f4a36]/10 text-[#1f4a36]">
        <Icon className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold text-[#1a2e22]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#5c6b5f]">{description}</p>
      <Button asChild className="mt-6 rounded-xl" size="lg">
        <Link to={to}>{cta}</Link>
      </Button>
    </div>
  );
}

function BuilderComparisonPreview({
  submissionId,
  payload,
  tab,
}: {
  submissionId: string;
  payload: Record<string, unknown>;
  tab: "contract" | "jv" | "interior" | "renovation";
}) {
  const column = buildComparisonColumnFromPayload(submissionId, payload, tab);
  if (!column) return null;

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-[#1a2e22]">Marketplace comparison preview</h3>
        <p className="mt-1 text-xs text-[#5c6b5f]">
          How landowners see your profile when comparing builders — including delivery stats and past projects.
        </p>
      </div>
      <BuilderComparisonTable columns={[column]} />
    </section>
  );
}

function RecentProjectsCards({
  projects,
}: {
  projects: RecentProject[];
}) {
  if (!projects.length) {
    return <p className="py-8 text-center text-sm text-[#5c6b5f]">No recent project entries yet.</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project, idx) => (
        <PastProjectShowcaseCard key={`${project.name_location ?? project.location ?? "project"}-${idx}`} project={project} index={idx} />
      ))}
    </div>
  );
}

type ContractEditDraft = {
  company_name: string;
  years_experience: string;
  license_rera: string;
  address: string;
  preferred_location: string;
  projects_completed: string;
  project_details: string;
  team_type: string;
  typical_size: string;
  typical_size_other: string;
  subcontractor_other: string;
  project_types_text: string;
  subcontractor_scopes_text: string;
  pricingJson: string;
  recentProjectsJson: string;
};

function contractPayloadToDraft(p: ContractConstructionPayload): ContractEditDraft {
  return {
    company_name: p.company_name ?? "",
    years_experience: p.years_experience ?? "",
    license_rera: p.license_rera ?? "",
    address: p.address ?? "",
    preferred_location: p.preferred_location ?? "",
    projects_completed: p.projects_completed ?? "",
    project_details: p.project_details ?? "",
    team_type: p.team_type ?? "",
    typical_size: p.typical_size ?? "",
    typical_size_other: p.typical_size_other ?? "",
    subcontractor_other: p.subcontractor_other ?? "",
    project_types_text: (p.project_types ?? []).join("\n"),
    subcontractor_scopes_text: (p.subcontractor_scopes ?? []).join("\n"),
    pricingJson: JSON.stringify(p.pricing ?? {}, null, 2),
    recentProjectsJson: JSON.stringify(p.recent_projects ?? [], null, 2),
  };
}

function strField(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  if (v === null || v === undefined) return "";
  return String(v);
}

/** Single-line interior tentative pricing; supports legacy four-field payloads. */
function interiorApproximateFromPricing(pricing: Record<string, unknown>): string {
  const ap = strField(pricing, "approximate").trim();
  if (ap) return ap;
  const parts = [
    strField(pricing, "price1200").trim(),
    strField(pricing, "price1500").trim(),
    strField(pricing, "price1800").trim(),
    strField(pricing, "priceOther").trim(),
  ].filter(Boolean);
  return parts.join(" · ");
}

type JvEditDraft = {
  company_name: string;
  years_experience: string;
  entity_type: string;
  builder_license: string;
  rera_registration: string;
  gst_number: string;
  address: string;
  preferred_locations: string;
  projects_completed: string;
  rera_yes_no: string;
  rera_projects: string;
  project_scale: string;
  team_size: string;
  location1: string;
  radius1: string;
  location2: string;
  radius2: string;
  location3: string;
  radius3: string;
  project_caps_text: string;
  jv_arrangements_text: string;
  pricingJson: string;
  recentJson: string;
};

function jvPayloadToDraft(p: Record<string, unknown>): JvEditDraft {
  return {
    company_name: strField(p, "company_name"),
    years_experience: strField(p, "years_experience"),
    entity_type: strField(p, "entity_type"),
    builder_license: strField(p, "builder_license"),
    rera_registration: strField(p, "rera_registration"),
    gst_number: strField(p, "gst_number"),
    address: strField(p, "address"),
    preferred_locations: strField(p, "preferred_locations"),
    projects_completed: strField(p, "projects_completed"),
    rera_yes_no: strField(p, "rera_yes_no"),
    rera_projects: strField(p, "rera_projects"),
    project_scale: strField(p, "project_scale"),
    team_size: strField(p, "team_size"),
    location1: strField(p, "location1"),
    radius1: strField(p, "radius1"),
    location2: strField(p, "location2"),
    radius2: strField(p, "radius2"),
    location3: strField(p, "location3"),
    radius3: strField(p, "radius3"),
    project_caps_text: (Array.isArray(p.project_caps) ? (p.project_caps as string[]) : []).join("\n"),
    jv_arrangements_text: (Array.isArray(p.jv_arrangements) ? (p.jv_arrangements as string[]) : []).join("\n"),
    pricingJson: JSON.stringify(p.pricing ?? {}, null, 2),
    recentJson: JSON.stringify(p.recent_projects ?? [], null, 2),
  };
}

type InteriorEditDraft = {
  company_name: string;
  years_experience: string;
  address: string;
  loc_address: string;
  loc_maps: string;
  scope_end: string;
  project_types_text: string;
  approximatePricing: string;
  recentJson: string;
};

function interiorPayloadToDraft(p: Record<string, unknown>): InteriorEditDraft {
  const location = (p.location as Record<string, unknown>) ?? {};
  const scope = (p.project_scope as Record<string, unknown>) ?? {};
  const pricing = (p.pricing as Record<string, unknown>) ?? {};
  return {
    company_name: strField(p, "company_name"),
    years_experience: strField(p, "years_experience"),
    address: strField(p, "address"),
    loc_address: strField(location, "address"),
    loc_maps: strField(location, "googleMapsAddress"),
    scope_end: strField(scope, "endToEndOrPartial"),
    project_types_text: (Array.isArray(p.project_types) ? (p.project_types as string[]) : []).join("\n"),
    approximatePricing: interiorApproximateFromPricing(pricing),
    recentJson: JSON.stringify(p.recent_projects ?? [], null, 2),
  };
}

type RenovationEditDraft = {
  company_name: string;
  years_experience: string;
  entity_type: string;
  builder_license: string;
  rera_registration: string;
  gst_number: string;
  address: string;
  loc_maps: string;
  projects_completed: string;
  project_caps_text: string;
  work_types_text: string;
  scopeJson: string;
  pricing_note: string;
  recentJson: string;
};

function renovationPayloadToDraft(p: Record<string, unknown>): RenovationEditDraft {
  const location = (p.location as Record<string, unknown>) ?? {};
  const scope = (p.scope_of_work as Record<string, unknown>) ?? {};
  const pricing = (p.pricing as Record<string, unknown>) ?? {};
  return {
    company_name: strField(p, "company_name"),
    years_experience: strField(p, "years_experience"),
    entity_type: strField(p, "entity_type"),
    builder_license: strField(p, "builder_license"),
    rera_registration: strField(p, "rera_registration"),
    gst_number: strField(p, "gst_number"),
    address: strField(p, "address"),
    loc_maps: strField(location, "googleMapsAddress"),
    projects_completed: strField(p, "projects_completed"),
    project_caps_text: (Array.isArray(p.project_caps) ? (p.project_caps as string[]) : []).join("\n"),
    work_types_text: (Array.isArray(p.work_types) ? (p.work_types as string[]) : []).join("\n"),
    scopeJson: JSON.stringify(scope && Object.keys(scope).length ? scope : {}, null, 2),
    pricing_note: strField(pricing, "note"),
    recentJson: JSON.stringify(p.recent_projects ?? [], null, 2),
  };
}

function ContractConstructionPanel({
  submission,
  onRefresh,
  autoEditSignal,
}: {
  submission: FormSubmissionDetail | null;
  onRefresh: () => Promise<void>;
  autoEditSignal?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ContractEditDraft | null>(null);

  const payload = submission?.payload as ContractConstructionPayload | undefined;

  useEffect(() => {
    if (!autoEditSignal || !payload) return;
    setDraft(contractPayloadToDraft(payload));
    setSaveError(null);
    setEditing(true);
  }, [autoEditSignal, payload]);

  if (!payload) {
    return (
      <TabEmpty
        icon={Hammer}
        title="No contract construction portfolio yet"
        description="Submit the Contract Construction form to show company details, pricing tables, and recent projects here."
        to="/builder/contract-construction"
        cta="Open Contract Construction form"
      />
    );
  }

  const recentProjects = payload.recent_projects ?? [];

  const startEdit = () => {
    setDraft(contractPayloadToDraft(payload));
    setSaveError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft(null);
    setSaveError(null);
  };

  const saveEdit = async () => {
    if (!submission || !draft) return;
    setSaving(true);
    setSaveError(null);
    try {
      let pricing: unknown;
      try {
        pricing = JSON.parse(draft.pricingJson.trim() || "{}");
      } catch {
        throw new Error("Pricing must be valid JSON (an object).");
      }
      if (typeof pricing !== "object" || pricing === null || Array.isArray(pricing)) {
        throw new Error("Pricing JSON must be an object, e.g. {\"residential\": {...}}.");
      }
      let recent_projects: unknown;
      try {
        recent_projects = JSON.parse(draft.recentProjectsJson.trim() || "[]");
      } catch {
        throw new Error("Recent projects must be valid JSON (an array).");
      }
      if (!Array.isArray(recent_projects)) {
        throw new Error("Recent projects JSON must be an array.");
      }
      const nextPayload: Record<string, unknown> = {
        ...(submission.payload as Record<string, unknown>),
        type: "contract-construction",
        company_name: draft.company_name.trim(),
        years_experience: draft.years_experience.trim(),
        license_rera: draft.license_rera.trim() || undefined,
        address: draft.address.trim(),
        project_types: linesToList(draft.project_types_text),
        preferred_location: draft.preferred_location.trim() || undefined,
        projects_completed: draft.projects_completed.trim() || undefined,
        project_details: draft.project_details.trim() || undefined,
        team_type: draft.team_type.trim() || undefined,
        subcontractor_scopes: linesToList(draft.subcontractor_scopes_text),
        subcontractor_other: draft.subcontractor_other.trim() || undefined,
        typical_size: draft.typical_size.trim() || undefined,
        typical_size_other: draft.typical_size_other.trim() || undefined,
        pricing,
        recent_projects,
      };
      await patchBuilderFormSubmission(submission.id, nextPayload);
      await onRefresh();
      setEditing(false);
      setDraft(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SubmittedMeta createdAt={submission?.created_at} />
        <PortfolioEditToolbar
          hasSubmission
          editing={editing}
          saving={saving}
          saveError={saveError}
          onEdit={startEdit}
          onCancel={cancelEdit}
          onSave={saveEdit}
          formHref="/builder/contract-construction"
          formLinkLabel="Open full form"
        />
      </div>

      {editing && draft ? (
        <div className={cn(cardShell, "p-4 sm:p-6")}>
          <p className="mb-4 text-sm text-[#5c6b5f]">
            Edit inline and save. <strong>Project types</strong> and <strong>subcontractor scopes</strong> are one entry
            per line. <strong>Pricing</strong> and <strong>recent projects</strong> must be valid JSON (same shape as stored
            from the full form).
          </p>
          <div className="grid max-w-4xl gap-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cc-company">Company name</Label>
                <Input
                  id="cc-company"
                  value={draft.company_name}
                  onChange={(e) => setDraft((d) => (d ? { ...d, company_name: e.target.value } : d))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cc-exp">Experience</Label>
                <Input
                  id="cc-exp"
                  value={draft.years_experience}
                  onChange={(e) => setDraft((d) => (d ? { ...d, years_experience: e.target.value } : d))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cc-rera">RERA / License</Label>
                <Input
                  id="cc-rera"
                  value={draft.license_rera}
                  onChange={(e) => setDraft((d) => (d ? { ...d, license_rera: e.target.value } : d))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cc-pref">Preferred location</Label>
                <Input
                  id="cc-pref"
                  value={draft.preferred_location}
                  onChange={(e) => setDraft((d) => (d ? { ...d, preferred_location: e.target.value } : d))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cc-pc">Projects completed</Label>
                <Input
                  id="cc-pc"
                  value={draft.projects_completed}
                  onChange={(e) => setDraft((d) => (d ? { ...d, projects_completed: e.target.value } : d))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cc-team">Team type</Label>
                <Input
                  id="cc-team"
                  value={draft.team_type}
                  onChange={(e) => setDraft((d) => (d ? { ...d, team_type: e.target.value } : d))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cc-ts">Typical size</Label>
                <Input
                  id="cc-ts"
                  value={draft.typical_size}
                  onChange={(e) => setDraft((d) => (d ? { ...d, typical_size: e.target.value } : d))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cc-tso">Typical size (other)</Label>
                <Input
                  id="cc-tso"
                  value={draft.typical_size_other}
                  onChange={(e) => setDraft((d) => (d ? { ...d, typical_size_other: e.target.value } : d))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cc-subo">Subcontractor other</Label>
                <Input
                  id="cc-subo"
                  value={draft.subcontractor_other}
                  onChange={(e) => setDraft((d) => (d ? { ...d, subcontractor_other: e.target.value } : d))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-addr">Registered address</Label>
              <Textarea
                id="cc-addr"
                rows={3}
                value={draft.address}
                onChange={(e) => setDraft((d) => (d ? { ...d, address: e.target.value } : d))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-pd">Project details</Label>
              <Textarea
                id="cc-pd"
                rows={4}
                value={draft.project_details}
                onChange={(e) => setDraft((d) => (d ? { ...d, project_details: e.target.value } : d))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-pt">Project types (one per line)</Label>
              <Textarea
                id="cc-pt"
                rows={4}
                value={draft.project_types_text}
                onChange={(e) => setDraft((d) => (d ? { ...d, project_types_text: e.target.value } : d))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-ss">Subcontractor scopes (one per line)</Label>
              <Textarea
                id="cc-ss"
                rows={3}
                value={draft.subcontractor_scopes_text}
                onChange={(e) => setDraft((d) => (d ? { ...d, subcontractor_scopes_text: e.target.value } : d))}
              />
            </div>
            <div className="space-y-2">
              <PricingEditor
                value={draft.pricingJson}
                onChange={(nextJson) => setDraft((d) => (d ? { ...d, pricingJson: nextJson } : d))}
              />
            </div>
            <div className="space-y-2">
              <RecentProjectsEditor
                value={draft.recentProjectsJson}
                onChange={(nextJson) => setDraft((d) => (d ? { ...d, recentProjectsJson: nextJson } : d))}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
      {submission ? (
        <BuilderComparisonPreview
          submissionId={submission.id}
          payload={payload as Record<string, unknown>}
          tab="contract"
        />
      ) : null}
      <section className={cardShell}>
        <div className={cardHeader}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#f4efe3]" />
              <h3 className="text-lg font-semibold tracking-tight">{payload.company_name || "Your company"}</h3>
            </div>
            <span className="rounded-full border border-[#c8a15a] bg-[#f4efe3]/20 px-3 py-0.5 text-[11px] font-semibold text-[#f4efe3]">
              Contract construction
            </span>
          </div>
        </div>
        <div className="space-y-5 p-4 sm:p-5">
          <div className="overflow-hidden rounded-xl border border-[#e7e3d9] bg-white/80">
            <div className="grid grid-cols-1 divide-y divide-[#e7e3d9] md:grid-cols-2 md:divide-x md:divide-y xl:grid-cols-3">
              {[
                ["Experience", payload.years_experience || "—"],
                ["Projects completed", payload.projects_completed || "—"],
                ["Typical project size", payload.typical_size_other || payload.typical_size || "—"],
                ["RERA / License", payload.license_rera || "—"],
                ["Preferred location", payload.preferred_location || "—"],
                ["Team type", payload.team_type || "—"],
              ].map(([label, value]) => (
                <div key={label} className="px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5c6b5f]">{label}</p>
                  <p className="mt-1 break-words text-sm font-semibold text-[#1a2e22]">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-white/80 p-4 ring-1 ring-[#e7e3d9]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#5c6b5f]">Registered address</p>
            <p className="mt-2 text-sm leading-relaxed text-[#1a2e22]">{payload.address || "—"}</p>
          </div>
          {payload.project_details ? (
            <div className="rounded-xl border border-dashed border-[#c8a15a]/50 bg-[#faf8f4] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#5c6b5f]">Project details</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#27342b]">{payload.project_details}</p>
            </div>
          ) : null}
          <div className="grid gap-4 xl:grid-cols-3">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#5c6b5f]">Project types</p>
              <div className="flex flex-wrap gap-2">
                {(payload.project_types ?? []).length ? (
                  payload.project_types!.map((type) => (
                    <span
                      key={type}
                      className="rounded-full border border-[#1f4a36]/20 bg-[#1f4a36]/10 px-3 py-1 text-xs font-semibold text-[#1f4a36]"
                    >
                      {type}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[#5c6b5f]">—</span>
                )}
              </div>
            </div>
            <div className="xl:col-span-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#5c6b5f]">Subcontractor scopes</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(payload.subcontractor_scopes ?? []).map((scope) => (
                  <span
                    key={scope}
                    className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#2a3e30] ring-1 ring-[#e7e3d9]"
                  >
                    {scope}
                  </span>
                ))}
                {payload.subcontractor_other ? (
                  <span className="rounded-full bg-[#fff7ed] px-2.5 py-1 text-xs font-medium text-[#9a3412] ring-1 ring-[#fed7aa]">
                    Other: {payload.subcontractor_other}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
      {payload.pricing && Object.keys(payload.pricing).length > 0 ? (
        <section className={cardShell}>
          <div className={cardHeader}>
            <h3 className="text-base font-semibold">Pricing packages</h3>
            <p className="mt-0.5 text-xs text-white/80">As submitted in your form</p>
          </div>
          <div className="space-y-6 p-4 sm:p-5">
            <ContractConstructionPricingSection pricing={payload.pricing} />
          </div>
        </section>
      ) : null}
      <section className={cardShell}>
        <div className={cardHeader}>
          <div>
            <h3 className="text-base font-semibold">Recent projects</h3>
            <p className="text-xs text-white/80">Photos and video per project</p>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <RecentProjectsCards projects={recentProjects} />
        </div>
      </section>
        </>
      )}
    </div>
  );
}

function JointVenturePanel({
  submission,
  onRefresh,
  autoEditSignal,
}: {
  submission: FormSubmissionDetail | null;
  onRefresh: () => Promise<void>;
  autoEditSignal?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draft, setDraft] = useState<JvEditDraft | null>(null);

  const p = submission?.payload as Record<string, unknown> | undefined;

  useEffect(() => {
    if (!autoEditSignal || !p || !String(p.company_name ?? "").trim()) return;
    setDraft(jvPayloadToDraft(p));
    setSaveError(null);
    setEditing(true);
  }, [autoEditSignal, p]);

  if (!p || !String(p.company_name ?? "").trim()) {
    return (
      <TabEmpty
        icon={Handshake}
        title="No JV / JD portfolio yet"
        description="Submit the JV / JD developer form to show joint-development details, locations, pricing, and portfolio here."
        to="/builder/joint-venture"
        cta="Open JV / JD form"
      />
    );
  }

  const projectCaps = (p.project_caps as string[]) ?? [];
  const jvArr = (p.jv_arrangements as string[]) ?? [];
  const recent = (p.recent_projects as RecentProject[]) ?? [];
  const pricing = p.pricing as Record<string, unknown> | undefined;

  const startEdit = () => {
    setDraft(jvPayloadToDraft(p));
    setSaveError(null);
    setEditing(true);
  };
  const cancelEdit = () => {
    setEditing(false);
    setDraft(null);
    setSaveError(null);
  };
  const saveEdit = async () => {
    if (!submission || !draft) return;
    setSaving(true);
    setSaveError(null);
    try {
      let pricingParsed: unknown;
      try {
        pricingParsed = JSON.parse(draft.pricingJson.trim() || "{}");
      } catch {
        throw new Error("Pricing must be valid JSON object.");
      }
      if (typeof pricingParsed !== "object" || pricingParsed === null || Array.isArray(pricingParsed)) {
        throw new Error("Pricing JSON must be an object.");
      }
      let recent_projects: unknown;
      try {
        recent_projects = JSON.parse(draft.recentJson.trim() || "[]");
      } catch {
        throw new Error("Recent projects must be valid JSON array.");
      }
      if (!Array.isArray(recent_projects)) throw new Error("Recent projects must be a JSON array.");
      const nextPayload: Record<string, unknown> = {
        ...(submission.payload as Record<string, unknown>),
        type: "joint-venture",
        company_name: draft.company_name.trim(),
        years_experience: draft.years_experience.trim(),
        entity_type: draft.entity_type.trim() || undefined,
        builder_license: draft.builder_license.trim() || undefined,
        rera_registration: draft.rera_registration.trim() || undefined,
        gst_number: draft.gst_number.trim() || undefined,
        address: draft.address.trim(),
        preferred_locations: draft.preferred_locations.trim() || undefined,
        projects_completed: draft.projects_completed.trim() || undefined,
        rera_yes_no: draft.rera_yes_no.trim() || undefined,
        rera_projects: draft.rera_projects.trim() || undefined,
        project_scale: draft.project_scale.trim() || undefined,
        team_size: draft.team_size.trim() || undefined,
        location1: draft.location1.trim() || undefined,
        radius1: draft.radius1.trim() || undefined,
        location2: draft.location2.trim() || undefined,
        radius2: draft.radius2.trim() || undefined,
        location3: draft.location3.trim() || undefined,
        radius3: draft.radius3.trim() || undefined,
        project_caps: linesToList(draft.project_caps_text),
        jv_arrangements: linesToList(draft.jv_arrangements_text),
        pricing: pricingParsed,
        recent_projects,
      };
      await patchBuilderFormSubmission(submission.id, nextPayload);
      await onRefresh();
      setEditing(false);
      setDraft(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const jvFieldRows: Array<[string, keyof JvEditDraft, string]> = [
    ["jv-co", "company_name", "Company name"],
    ["jv-exp", "years_experience", "Experience"],
    ["jv-ent", "entity_type", "Entity type"],
    ["jv-bl", "builder_license", "Builder license"],
    ["jv-rera", "rera_registration", "RERA registration"],
    ["jv-gst", "gst_number", "GST"],
    ["jv-pl", "preferred_locations", "Preferred locations"],
    ["jv-pc", "projects_completed", "Projects completed"],
    ["jv-rn", "rera_yes_no", "RERA Y/N"],
    ["jv-rp", "rera_projects", "RERA projects"],
    ["jv-ps", "project_scale", "Project scale"],
    ["jv-ts", "team_size", "Team size"],
    ["jv-l1", "location1", "Location 1"],
    ["jv-r1", "radius1", "Radius 1"],
    ["jv-l2", "location2", "Location 2"],
    ["jv-r2", "radius2", "Radius 2"],
    ["jv-l3", "location3", "Location 3"],
    ["jv-r3", "radius3", "Radius 3"],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SubmittedMeta createdAt={submission?.created_at} />
        <PortfolioEditToolbar
          hasSubmission
          editing={editing}
          saving={saving}
          saveError={saveError}
          onEdit={startEdit}
          onCancel={cancelEdit}
          onSave={saveEdit}
          formHref="/builder/joint-venture"
          formLinkLabel="Open full form"
        />
      </div>

      {editing && draft ? (
        <div className={cn(cardShell, "p-4 sm:p-6")}>
          <p className="mb-4 text-sm text-[#5c6b5f]">
            Edit JV / JD details. <strong>Project capabilities</strong> and <strong>JV arrangements</strong>: one per line.
            <strong> Pricing</strong> = JSON object, <strong>recent projects</strong> = JSON array.
          </p>
          <div className="grid max-w-4xl gap-3 sm:grid-cols-2">
            {jvFieldRows.map(([id, fieldKey, label]) => (
              <div key={id} className="space-y-2">
                <Label htmlFor={id}>{label}</Label>
                <Input
                  id={id}
                  value={draft[fieldKey]}
                  onChange={(e) => setDraft((d) => (d ? { ...d, [fieldKey]: e.target.value } : d))}
                />
              </div>
            ))}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="jv-addr">Address</Label>
              <Textarea
                id="jv-addr"
                rows={3}
                value={draft.address}
                onChange={(e) => setDraft((d) => (d ? { ...d, address: e.target.value } : d))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="jv-caps">Project capabilities (one per line)</Label>
              <Textarea
                id="jv-caps"
                rows={4}
                value={draft.project_caps_text}
                onChange={(e) => setDraft((d) => (d ? { ...d, project_caps_text: e.target.value } : d))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="jv-jva">JV arrangements (one per line)</Label>
              <Textarea
                id="jv-jva"
                rows={3}
                value={draft.jv_arrangements_text}
                onChange={(e) => setDraft((d) => (d ? { ...d, jv_arrangements_text: e.target.value } : d))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <PricingEditor
                value={draft.pricingJson}
                onChange={(nextJson) => setDraft((d) => (d ? { ...d, pricingJson: nextJson } : d))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <RecentProjectsEditor
                value={draft.recentJson}
                onChange={(nextJson) => setDraft((d) => (d ? { ...d, recentJson: nextJson } : d))}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
      {submission && p ? (
        <BuilderComparisonPreview submissionId={submission.id} payload={p} tab="jv" />
      ) : null}
      <section className={cardShell}>
        <div className={cardHeader}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-[#f4efe3]" />
              <h3 className="text-lg font-semibold tracking-tight">{String(p.company_name)}</h3>
            </div>
            <span className="rounded-full border border-[#c8a15a] bg-[#f4efe3]/20 px-3 py-0.5 text-[11px] font-semibold text-[#f4efe3]">
              JV / JD
            </span>
          </div>
        </div>
        <div className="space-y-5 p-4 sm:p-5">
          <div className="overflow-hidden rounded-xl border border-[#e7e3d9] bg-white/80">
            <div className="grid grid-cols-1 divide-y divide-[#e7e3d9] md:grid-cols-2 md:divide-x md:divide-y xl:grid-cols-3">
              {[
                ["Experience", displayStr(p.years_experience)],
                ["Entity type", displayStr(p.entity_type)],
                ["RERA registration", displayStr(p.rera_registration)],
                ["GST", displayStr(p.gst_number)],
                ["Projects completed", displayStr(p.projects_completed)],
                ["Team size", displayStr(p.team_size)],
                ["Project scale", displayStr(p.project_scale)],
                ["RERA (Y/N)", displayStr(p.rera_yes_no)],
                ["RERA projects", displayStr(p.rera_projects)],
                ["Preferred locations", displayStr(p.preferred_locations)],
              ].map(([label, value]) => (
                <div key={label} className="px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5c6b5f]">{label}</p>
                  <p className="mt-1 break-words text-sm font-semibold text-[#1a2e22]">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-white/80 p-4 ring-1 ring-[#e7e3d9]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#5c6b5f]">Address</p>
            <p className="mt-2 text-sm leading-relaxed text-[#1a2e22]">{displayStr(p.address)}</p>
          </div>
          <div className="rounded-xl bg-white/80 p-4 ring-1 ring-[#e7e3d9]">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#5c6b5f]">Builder license</p>
            <p className="text-sm text-[#1a2e22]">{displayStr(p.builder_license)}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#5c6b5f]">Project capabilities</p>
              <div className="flex flex-wrap gap-2">
                {projectCaps.length
                  ? projectCaps.map((c) => (
                      <span
                        key={c}
                        className="rounded-full border border-[#1f4a36]/20 bg-[#1f4a36]/10 px-3 py-1 text-xs font-semibold text-[#1f4a36]"
                      >
                        {c}
                      </span>
                    ))
                  : "—"}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#5c6b5f]">JV arrangements</p>
              <div className="flex flex-wrap gap-2">
                {jvArr.length
                  ? jvArr.map((c) => (
                      <span
                        key={c}
                        className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#2a3e30] ring-1 ring-[#e7e3d9]"
                      >
                        {c}
                      </span>
                    ))
                  : "—"}
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-[#e7e3d9] bg-white/80">
            <p className="border-b border-[#e7e3d9] bg-[#f6f3ee] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#1a2e22]">
              Preferred radii
            </p>
            <div className="grid divide-y divide-[#e7e3d9] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {[
                ["Location 1", p.location1, p.radius1],
                ["Location 2", p.location2, p.radius2],
                ["Location 3", p.location3, p.radius3],
              ].map(([label, loc, rad]) => (
                <div key={label as string} className="px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase text-[#5c6b5f]">{label as string}</p>
                  <p className="mt-1 text-sm font-medium text-[#1a2e22]">{displayStr(loc)}</p>
                  <p className="mt-0.5 text-xs text-[#5c6b5f]">Radius: {displayStr(rad)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {pricing && Object.keys(pricing).length > 0 ? (
        <section className={cardShell}>
          <div className={cardHeader}>
            <h3 className="text-base font-semibold">Pricing packages</h3>
            <p className="mt-0.5 text-xs text-white/80">Indicative pricing from your JV / JD form</p>
          </div>
          <div className="space-y-6 p-4 sm:p-5">
            {Object.entries(pricing).map(([segment, details]) => (
              <PricingSegmentBlock key={segment} segment={segment} details={details} />
            ))}
          </div>
        </section>
      ) : null}
      <section className={cardShell}>
        <div className={cardHeader}>
          <h3 className="text-base font-semibold">Recent projects</h3>
          <p className="text-xs text-white/80">Portfolio entries</p>
        </div>
        <div className="p-4 sm:p-5">
          <RecentProjectsCards projects={recent} />
        </div>
      </section>
        </>
      )}
    </div>
  );
}

function InteriorPanel({
  submission,
  onRefresh,
  autoEditSignal,
}: {
  submission: FormSubmissionDetail | null;
  onRefresh: () => Promise<void>;
  autoEditSignal?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draft, setDraft] = useState<InteriorEditDraft | null>(null);

  const p = submission?.payload as Record<string, unknown> | undefined;

  useEffect(() => {
    if (!autoEditSignal || !p || (!p.company_name && !p.address)) return;
    setDraft(interiorPayloadToDraft(p));
    setSaveError(null);
    setEditing(true);
  }, [autoEditSignal, p]);
  if (!p || (!p.company_name && !p.address)) {
    return (
      <TabEmpty
        icon={Palette}
        title="No interior portfolio yet"
        description="Submit the Interior architect form to show company details, tentative pricing, locations, and project photos here."
        to="/builder/interior"
        cta="Open Interior form"
      />
    );
  }

  const projectTypes = (p.project_types as string[]) ?? [];
  const location = (p.location as Record<string, unknown>) ?? {};
  const scope = (p.project_scope as Record<string, unknown>) ?? {};
  const pricing = (p.pricing as Record<string, unknown>) ?? {};
  const recent = (p.recent_projects as RecentProject[]) ?? [];
  const approxLine = interiorApproximateFromPricing(pricing);
  const pricingRows: [string, string][] = [
    ["Approximate amount / range (typical projects)", approxLine ? approxLine : "—"],
  ];

  const startEdit = () => {
    setDraft(interiorPayloadToDraft(p));
    setSaveError(null);
    setEditing(true);
  };
  const cancelEdit = () => {
    setEditing(false);
    setDraft(null);
    setSaveError(null);
  };
  const saveEdit = async () => {
    if (!submission || !draft) return;
    setSaving(true);
    setSaveError(null);
    try {
      let recent_projects: unknown;
      try {
        recent_projects = JSON.parse(draft.recentJson.trim() || "[]");
      } catch {
        throw new Error("Recent projects must be valid JSON array.");
      }
      if (!Array.isArray(recent_projects)) throw new Error("Recent projects must be a JSON array.");
      const nextPayload: Record<string, unknown> = {
        ...(submission.payload as Record<string, unknown>),
        type: "interior",
        company_name: draft.company_name.trim() || undefined,
        years_experience: draft.years_experience.trim() || undefined,
        address: draft.address.trim() || undefined,
        project_types: linesToList(draft.project_types_text),
        location: {
          address: draft.loc_address.trim() || undefined,
          googleMapsAddress: draft.loc_maps.trim() || undefined,
        },
        project_scope: {
          endToEndOrPartial: draft.scope_end.trim() || undefined,
        },
        pricing: {
          approximate: draft.approximatePricing.trim() || undefined,
        },
        recent_projects,
      };
      await patchBuilderFormSubmission(submission.id, nextPayload);
      await onRefresh();
      setEditing(false);
      setDraft(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SubmittedMeta createdAt={submission?.created_at} />
        <PortfolioEditToolbar
          hasSubmission
          editing={editing}
          saving={saving}
          saveError={saveError}
          onEdit={startEdit}
          onCancel={cancelEdit}
          onSave={saveEdit}
          formHref="/builder/interior"
          formLinkLabel="Open full form"
        />
      </div>

      {editing && draft ? (
        <div className={cn(cardShell, "p-4 sm:p-6")}>
          <p className="mb-4 text-sm text-[#5c6b5f]">
            Edit interior profile. <strong>Project types</strong>: one per line. <strong>Recent projects</strong>: JSON array.
          </p>
          <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="in-co">Company name</Label>
              <Input
                id="in-co"
                value={draft.company_name}
                onChange={(e) => setDraft((d) => (d ? { ...d, company_name: e.target.value } : d))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="in-exp">Experience</Label>
              <Input
                id="in-exp"
                value={draft.years_experience}
                onChange={(e) => setDraft((d) => (d ? { ...d, years_experience: e.target.value } : d))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="in-addr">Registered address</Label>
              <Textarea
                id="in-addr"
                rows={2}
                value={draft.address}
                onChange={(e) => setDraft((d) => (d ? { ...d, address: e.target.value } : d))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="in-la">Location (address field)</Label>
              <Input
                id="in-la"
                value={draft.loc_address}
                onChange={(e) => setDraft((d) => (d ? { ...d, loc_address: e.target.value } : d))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="in-lm">Google Maps link</Label>
              <Input
                id="in-lm"
                value={draft.loc_maps}
                onChange={(e) => setDraft((d) => (d ? { ...d, loc_maps: e.target.value } : d))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="in-scope">End-to-end / partial</Label>
              <Input
                id="in-scope"
                value={draft.scope_end}
                onChange={(e) => setDraft((d) => (d ? { ...d, scope_end: e.target.value } : d))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="in-approx">Approximate amount / range (typical projects)</Label>
              <Textarea
                id="in-approx"
                rows={3}
                placeholder="e.g. ₹12L–18L for a 1200 sft flat, or per-sft notes"
                value={draft.approximatePricing}
                onChange={(e) => setDraft((d) => (d ? { ...d, approximatePricing: e.target.value } : d))}
              />
              <p className="text-xs text-[#5c6b5f]">
                Reference examples: 1200 sft flat end-to-end; 1500 sft duplex; 1800 sft commercial fit-out; other scopes — combined in this one field.
              </p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="in-pt">Project types (one per line)</Label>
              <Textarea
                id="in-pt"
                rows={4}
                value={draft.project_types_text}
                onChange={(e) => setDraft((d) => (d ? { ...d, project_types_text: e.target.value } : d))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <RecentProjectsEditor
                value={draft.recentJson}
                onChange={(nextJson) => setDraft((d) => (d ? { ...d, recentJson: nextJson } : d))}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
      {submission && p ? (
        <BuilderComparisonPreview submissionId={submission.id} payload={p} tab="interior" />
      ) : null}
      <section className={cardShell}>
        <div className={cardHeader}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-[#f4efe3]" />
              <h3 className="text-lg font-semibold tracking-tight">{displayStr(p.company_name)}</h3>
            </div>
            <span className="rounded-full border border-[#c8a15a] bg-[#f4efe3]/20 px-3 py-0.5 text-[11px] font-semibold text-[#f4efe3]">
              Interior
            </span>
          </div>
        </div>
        <div className="space-y-5 p-4 sm:p-5">
          <div className="overflow-hidden rounded-xl border border-[#e7e3d9] bg-white/80">
            <div className="grid grid-cols-1 divide-y divide-[#e7e3d9] md:grid-cols-2 md:divide-x md:divide-y-0">
              <div className="px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5c6b5f]">Experience</p>
                <p className="mt-1 text-sm font-semibold text-[#1a2e22]">{displayStr(p.years_experience)}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5c6b5f]">Registered address</p>
                <p className="mt-1 text-sm font-semibold text-[#1a2e22]">{displayStr(p.address)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-[#e7e3d9] bg-white/80 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#1a2e22]">Location & maps</p>
            <div className="mt-3 space-y-2 text-sm">
              <p>
                <span className="font-semibold text-[#5c6b5f]">Address: </span>
                {displayStr(location.address)}
              </p>
              <p>
                <span className="font-semibold text-[#5c6b5f]">Google Maps: </span>
                {displayStr(location.googleMapsAddress)}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-[#e7e3d9] bg-white/80 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#1a2e22]">Project scope</p>
            <p className="mt-2 text-sm text-[#1a2e22]">
              <span className="font-semibold text-[#5c6b5f]">End-to-end / partial: </span>
              {displayStr(scope.endToEndOrPartial)}
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#5c6b5f]">Project types</p>
            <div className="flex flex-wrap gap-2">
              {projectTypes.length
                ? projectTypes.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-[#1f4a36]/20 bg-[#1f4a36]/10 px-3 py-1 text-xs font-semibold text-[#1f4a36]"
                    >
                      {t}
                    </span>
                  ))
                : "—"}
            </div>
          </div>
        </div>
      </section>
      <section className={cardShell}>
        <div className={cardHeader}>
          <h3 className="text-base font-semibold">Tentative pricing</h3>
        </div>
        <div className="overflow-x-auto p-4 sm:p-5">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="bg-[#1f4a36] text-left text-white">
                <th className="px-4 py-2.5 font-semibold">Description</th>
                <th className="px-4 py-2.5 font-semibold">Your rate / note</th>
              </tr>
            </thead>
            <tbody>
              {pricingRows.map(([k, v], i) => (
                <tr key={k} className={i % 2 === 0 ? "bg-white" : "bg-[#faf8f4]"}>
                  <td className="border border-[#e7e3d9] px-4 py-2 font-medium text-[#5c6b5f]">{k}</td>
                  <td className="border border-[#e7e3d9] px-4 py-2 text-[#1a2e22] whitespace-pre-wrap">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className={cardShell}>
        <div className={cardHeader}>
          <h3 className="text-base font-semibold">Recent projects</h3>
        </div>
        <div className="p-4 sm:p-5">
          <RecentProjectsCards projects={recent} />
        </div>
      </section>
        </>
      )}
    </div>
  );
}

function RenovationPanel({
  submission,
  onRefresh,
  autoEditSignal,
}: {
  submission: FormSubmissionDetail | null;
  onRefresh: () => Promise<void>;
  autoEditSignal?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draft, setDraft] = useState<RenovationEditDraft | null>(null);

  const p = submission?.payload as Record<string, unknown> | undefined;

  useEffect(() => {
    if (!autoEditSignal || !p || (!p.company_name && !p.address)) return;
    setDraft(renovationPayloadToDraft(p));
    setSaveError(null);
    setEditing(true);
  }, [autoEditSignal, p]);
  if (!p || (!p.company_name && !p.address)) {
    return (
      <TabEmpty
        icon={Paintbrush}
        title="No renovation / repaint portfolio yet"
        description="Submit the Renovation/Repaint form to show capabilities, execution model, pricing note, and recent work here."
        to="/builder/reconstruction"
        cta="Open Renovation/Repaint form"
      />
    );
  }

  const caps = (p.project_caps as string[]) ?? [];
  const workTypes = (p.work_types as string[]) ?? [];
  const scope = (p.scope_of_work as Record<string, unknown>) ?? {};
  const location = (p.location as Record<string, unknown>) ?? {};
  const pricing = (p.pricing as Record<string, unknown>) ?? {};
  const recent = (p.recent_projects as RecentProject[]) ?? [];
  const scopeRows: [string, string][] = [
    ["Team type", displayStr(scope.teamType)],
    ["Subcontractor scopes", displayStr(scope.subcontractorScopes)],
    ["Subcontractor (other)", displayStr(scope.subcontractorOther)],
    ["Typical size", displayStr(scope.typicalSize)],
    ["Work types (scope)", displayStr(scope.workTypes)],
    ["Work type (other)", displayStr(scope.workTypeOther)],
    ["Pricing note (scope block)", displayStr(scope.pricingNote)],
  ];

  const startEdit = () => {
    setDraft(renovationPayloadToDraft(p));
    setSaveError(null);
    setEditing(true);
  };
  const cancelEdit = () => {
    setEditing(false);
    setDraft(null);
    setSaveError(null);
  };
  const saveEdit = async () => {
    if (!submission || !draft) return;
    setSaving(true);
    setSaveError(null);
    try {
      let scope_of_work: unknown;
      try {
        scope_of_work = JSON.parse(draft.scopeJson.trim() || "{}");
      } catch {
        throw new Error("Execution & scope must be valid JSON object.");
      }
      if (typeof scope_of_work !== "object" || scope_of_work === null || Array.isArray(scope_of_work)) {
        throw new Error("Scope JSON must be an object.");
      }
      let recent_projects: unknown;
      try {
        recent_projects = JSON.parse(draft.recentJson.trim() || "[]");
      } catch {
        throw new Error("Recent projects must be valid JSON array.");
      }
      if (!Array.isArray(recent_projects)) throw new Error("Recent projects must be a JSON array.");
      const work_types = linesToList(draft.work_types_text);
      const nextPayload: Record<string, unknown> = {
        ...(submission.payload as Record<string, unknown>),
        type: "reconstruction",
        company_name: draft.company_name.trim() || undefined,
        years_experience: draft.years_experience.trim() || undefined,
        entity_type: draft.entity_type.trim() || undefined,
        builder_license: draft.builder_license.trim() || undefined,
        rera_registration: draft.rera_registration.trim() || undefined,
        gst_number: draft.gst_number.trim() || undefined,
        address: draft.address.trim() || undefined,
        location: {
          ...(typeof p.location === "object" && p.location !== null ? (p.location as Record<string, unknown>) : {}),
          googleMapsAddress: draft.loc_maps.trim() || undefined,
        },
        projects_completed: draft.projects_completed.trim() || undefined,
        project_caps: linesToList(draft.project_caps_text),
        work_types,
        scope_of_work,
        pricing: { note: draft.pricing_note.trim() || undefined },
        recent_projects,
      };
      await patchBuilderFormSubmission(submission.id, nextPayload);
      await onRefresh();
      setEditing(false);
      setDraft(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SubmittedMeta createdAt={submission?.created_at} />
        <PortfolioEditToolbar
          hasSubmission
          editing={editing}
          saving={saving}
          saveError={saveError}
          onEdit={startEdit}
          onCancel={cancelEdit}
          onSave={saveEdit}
          formHref="/builder/reconstruction"
          formLinkLabel="Open full form"
        />
      </div>

      {editing && draft ? (
        <div className={cn(cardShell, "p-4 sm:p-6")}>
          <p className="mb-4 text-sm text-[#5c6b5f]">
            Edit renovation/repaint profile. <strong>Capabilities</strong> and <strong>work types</strong>: one per line.
            <strong> Scope</strong> = JSON object (execution fields). <strong>Recent projects</strong> = JSON array.
          </p>
          <div className="grid max-w-4xl gap-3 sm:grid-cols-2">
            {(
              [
                ["rn-co", "company_name", "Company name"],
                ["rn-exp", "years_experience", "Experience"],
                ["rn-ent", "entity_type", "Entity type"],
                ["rn-bl", "builder_license", "Builder license"],
                ["rn-rera", "rera_registration", "RERA"],
                ["rn-gst", "gst_number", "GST"],
                ["rn-pc", "projects_completed", "Projects completed"],
              ] as const
            ).map(([id, key, label]) => (
              <div key={id} className="space-y-2">
                <Label htmlFor={id}>{label}</Label>
                <Input
                  id={id}
                  value={draft[key as keyof RenovationEditDraft]}
                  onChange={(e) => setDraft((d) => (d ? { ...d, [key]: e.target.value } : d))}
                />
              </div>
            ))}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="rn-addr">Address</Label>
              <Textarea
                id="rn-addr"
                rows={2}
                value={draft.address}
                onChange={(e) => setDraft((d) => (d ? { ...d, address: e.target.value } : d))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="rn-maps">Google Maps (location)</Label>
              <Input
                id="rn-maps"
                value={draft.loc_maps}
                onChange={(e) => setDraft((d) => (d ? { ...d, loc_maps: e.target.value } : d))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="rn-pn">Pricing note</Label>
              <Input
                id="rn-pn"
                value={draft.pricing_note}
                onChange={(e) => setDraft((d) => (d ? { ...d, pricing_note: e.target.value } : d))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="rn-caps">Project capabilities (one per line)</Label>
              <Textarea
                id="rn-caps"
                rows={4}
                value={draft.project_caps_text}
                onChange={(e) => setDraft((d) => (d ? { ...d, project_caps_text: e.target.value } : d))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="rn-wt">Work types (one per line)</Label>
              <Textarea
                id="rn-wt"
                rows={4}
                value={draft.work_types_text}
                onChange={(e) => setDraft((d) => (d ? { ...d, work_types_text: e.target.value } : d))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="rn-scope">Execution & scope (JSON object)</Label>
              <Textarea
                id="rn-scope"
                className="font-mono text-xs sm:text-sm"
                rows={12}
                value={draft.scopeJson}
                onChange={(e) => setDraft((d) => (d ? { ...d, scopeJson: e.target.value } : d))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <RecentProjectsEditor
                value={draft.recentJson}
                onChange={(nextJson) => setDraft((d) => (d ? { ...d, recentJson: nextJson } : d))}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
      {submission && p ? (
        <BuilderComparisonPreview submissionId={submission.id} payload={p} tab="renovation" />
      ) : null}
      <section className={cardShell}>
        <div className={cardHeader}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Paintbrush className="h-5 w-5 text-[#f4efe3]" />
              <h3 className="text-lg font-semibold tracking-tight">{displayStr(p.company_name)}</h3>
            </div>
            <span className="rounded-full border border-[#c8a15a] bg-[#f4efe3]/20 px-3 py-0.5 text-[11px] font-semibold text-[#f4efe3]">
              Renovation / Repaint
            </span>
          </div>
        </div>
        <div className="space-y-5 p-4 sm:p-5">
          <div className="overflow-hidden rounded-xl border border-[#e7e3d9] bg-white/80">
            <div className="grid grid-cols-1 divide-y divide-[#e7e3d9] md:grid-cols-2 md:divide-x md:divide-y xl:grid-cols-3">
              {[
                ["Experience", displayStr(p.years_experience)],
                ["Entity type", displayStr(p.entity_type)],
                ["Builder license", displayStr(p.builder_license)],
                ["RERA", displayStr(p.rera_registration)],
                ["GST", displayStr(p.gst_number)],
                ["Projects completed", displayStr(p.projects_completed)],
              ].map(([label, value]) => (
                <div key={label} className="px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5c6b5f]">{label}</p>
                  <p className="mt-1 break-words text-sm font-semibold text-[#1a2e22]">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-white/80 p-4 ring-1 ring-[#e7e3d9]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#5c6b5f]">Address</p>
            <p className="mt-2 text-sm leading-relaxed text-[#1a2e22]">{displayStr(p.address)}</p>
            <p className="mt-2 text-sm text-[#5c6b5f]">
              <span className="font-semibold">Maps: </span>
              {displayStr(location.googleMapsAddress)}
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#5c6b5f]">Project capabilities</p>
            <div className="flex flex-wrap gap-2">
              {caps.length
                ? caps.map((c) => (
                    <span
                      key={c}
                      className="rounded-full border border-[#1f4a36]/20 bg-[#1f4a36]/10 px-3 py-1 text-xs font-semibold text-[#1f4a36]"
                    >
                      {c}
                    </span>
                  ))
                : "—"}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#5c6b5f]">Work type preferences</p>
            <div className="flex flex-wrap gap-2">
              {workTypes.length
                ? workTypes.map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#2a3e30] ring-1 ring-[#e7e3d9]"
                    >
                      {c}
                    </span>
                  ))
                : "—"}
            </div>
          </div>
        </div>
      </section>
      <section className={cardShell}>
        <div className={cardHeader}>
          <h3 className="text-base font-semibold">Execution & scope</h3>
        </div>
        <div className="overflow-x-auto p-4 sm:p-5">
          <table className="w-full min-w-[400px] border-collapse text-sm">
            <tbody>
              {scopeRows.map(([k, v], i) => (
                <tr key={k} className={i % 2 === 0 ? "bg-white" : "bg-[#faf8f4]"}>
                  <td className="border border-[#e7e3d9] px-4 py-2 font-medium text-[#5c6b5f]">{k}</td>
                  <td className="border border-[#e7e3d9] px-4 py-2 break-words text-[#1a2e22]">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className={cardShell}>
        <div className={cardHeader}>
          <h3 className="text-base font-semibold">Pricing note</h3>
        </div>
        <div className="p-4 sm:p-5 text-sm text-[#1a2e22]">{displayStr(pricing.note)}</div>
      </section>
      <section className={cardShell}>
        <div className={cardHeader}>
          <h3 className="text-base font-semibold">Recent projects</h3>
        </div>
        <div className="p-4 sm:p-5">
          <RecentProjectsCards projects={recent} />
        </div>
      </section>
        </>
      )}
    </div>
  );
}

function tabBadge(hasData: boolean) {
  if (!hasData) return null;
  return <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#c8a15a]" aria-hidden />;
}

type PortfolioTabValue = "contract" | "jv" | "interior" | "renovation";

export default function BuilderPortfolio() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof getBuilderPortfolioLatest>> | null>(null);
  const [activeTab, setActiveTab] = useState<PortfolioTabValue>("contract");
  const [editSignals, setEditSignals] = useState<Record<PortfolioTabValue, number>>({
    contract: 0,
    jv: 0,
    interior: 0,
    renovation: 0,
  });

  const refreshPortfolio = useCallback(async () => {
    const bundle = await getBuilderPortfolioLatest();
    setData(bundle);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bundle = await getBuilderPortfolioLatest();
        if (!cancelled) setData(bundle);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load portfolio");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    if (!data) return { filled: 0 };
    const n = [data.contract_construction, data.joint_venture, data.interior, data.renovation_repaint].filter(Boolean)
      .length;
    return { filled: n };
  }, [data]);

  const openCardDetails = useCallback((tab: PortfolioTabValue) => {
    setActiveTab(tab);
    setEditSignals((prev) => ({ ...prev, [tab]: prev[tab] + 1 }));
    const details = document.getElementById("builder-portfolio-details");
    if (details) details.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const typeCards = useMemo(() => {
    const contract = data?.contract_construction?.payload as ContractConstructionPayload | undefined;
    const jv = (data?.joint_venture?.payload as Record<string, unknown> | undefined) ?? undefined;
    const interior = (data?.interior?.payload as Record<string, unknown> | undefined) ?? undefined;
    const renovation = (data?.renovation_repaint?.payload as Record<string, unknown> | undefined) ?? undefined;

    return [
      {
        key: "contract",
        tab: "contract" as PortfolioTabValue,
        icon: Hammer,
        title: "Contract Construction",
        status: contract ? ("saved" as const) : ("empty" as const),
        lines: [
          ["Company", displayStr(contract?.company_name)],
          ["Experience", displayStr(contract?.years_experience)],
          ["Projects", displayStr(contract?.projects_completed)],
          ["Location", displayStr(contract?.preferred_location)],
          ["Updated", displayStr(data?.contract_construction?.created_at ? new Date(data.contract_construction.created_at).toLocaleDateString() : undefined)],
        ] as [string, string][],
      },
      {
        key: "jv",
        tab: "jv" as PortfolioTabValue,
        icon: Handshake,
        title: "JV / JD",
        status: jv ? ("saved" as const) : ("empty" as const),
        lines: [
          ["Company", displayStr(jv?.company_name)],
          ["Experience", displayStr(jv?.years_experience)],
          ["Locations", displayStr((jv?.locations_served as string[] | undefined) ?? [])],
          ["Projects", displayStr(jv?.projects_completed)],
          ["Updated", displayStr(data?.joint_venture?.created_at ? new Date(data.joint_venture.created_at).toLocaleDateString() : undefined)],
        ] as [string, string][],
      },
      {
        key: "interior",
        tab: "interior" as PortfolioTabValue,
        icon: Palette,
        title: "Interior",
        status: interior ? ("saved" as const) : ("empty" as const),
        lines: [
          ["Company", displayStr(interior?.company_name)],
          ["Experience", displayStr(interior?.years_experience)],
          ["Projects", displayStr(interior?.projects_completed)],
          ["Service area", displayStr((interior?.location as Record<string, unknown> | undefined)?.googleMapsAddress)],
          ["Updated", displayStr(data?.interior?.created_at ? new Date(data.interior.created_at).toLocaleDateString() : undefined)],
        ] as [string, string][],
      },
      {
        key: "renovation",
        tab: "renovation" as PortfolioTabValue,
        icon: Paintbrush,
        title: "Renovation / Repaint",
        status: renovation ? ("saved" as const) : ("empty" as const),
        lines: [
          ["Company", displayStr(renovation?.company_name)],
          ["Experience", displayStr(renovation?.years_experience)],
          ["Projects", displayStr(renovation?.projects_completed)],
          ["Service area", displayStr((renovation?.location as Record<string, unknown> | undefined)?.googleMapsAddress)],
          ["Updated", displayStr(data?.renovation_repaint?.created_at ? new Date(data.renovation_repaint.created_at).toLocaleDateString() : undefined)],
        ] as [string, string][],
      },
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-[#5c6b5f]">
        <Loader2 className="h-9 w-9 animate-spin text-[#1f4a36]" />
        <p className="text-sm font-medium">Loading your portfolio…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          cardShell,
          "border-destructive/25 bg-destructive/[0.06] p-6 text-center text-sm text-destructive"
        )}
      >
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#b0893d]">Account</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1a2e22]">Portfolio</h2>
        <p className="mt-1 max-w-2xl text-sm text-[#5c6b5f]">
          Each tab shows your <strong>latest saved submission</strong> for that builder profile type (contract construction,
          JV/JD, interior, or renovation/repaint). Submit or update the matching form to populate a tab.
        </p>
        {counts.filled > 0 ? (
          <p className="mt-2 text-xs text-[#5c6b5f]">{counts.filled} of 4 profile type(s) have saved data.</p>
        ) : (
          <p className="mt-2 text-xs text-[#5c6b5f]">No submissions yet — open a tab and follow the link to fill the form.</p>
        )}
      </div>

      <section>
        <div className="mb-2 flex items-center gap-2">
          <Building2 className="h-4.5 w-4.5 text-[#1f4a36]" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#4f5f54]">Profile Type Overview</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {typeCards.map((card) => (
            <PortfolioTypeSummaryCard
              key={card.key}
              icon={card.icon}
              title={card.title}
              status={card.status}
              lines={card.lines}
              onClick={() => openCardDetails(card.tab)}
            />
          ))}
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PortfolioTabValue)} className="w-full">
        <TabsList className="mb-4 flex h-auto min-h-10 w-full flex-wrap justify-start gap-1 bg-muted/80 p-1.5">
          <TabsTrigger value="contract" className="gap-0 rounded-lg px-3 py-2 text-xs sm:text-sm">
            Contract construction
            {tabBadge(!!data?.contract_construction)}
          </TabsTrigger>
          <TabsTrigger value="jv" className="gap-0 rounded-lg px-3 py-2 text-xs sm:text-sm">
            JV / JD
            {tabBadge(!!data?.joint_venture)}
          </TabsTrigger>
          <TabsTrigger value="interior" className="gap-0 rounded-lg px-3 py-2 text-xs sm:text-sm">
            Interior
            {tabBadge(!!data?.interior)}
          </TabsTrigger>
          <TabsTrigger value="renovation" className="gap-0 rounded-lg px-3 py-2 text-xs sm:text-sm">
            Renovation / Repaint
            {tabBadge(!!data?.renovation_repaint)}
          </TabsTrigger>
        </TabsList>
        <TabsContent id="builder-portfolio-details" value="contract" className="mt-0 focus-visible:outline-none">
          <ContractConstructionPanel
            submission={data?.contract_construction ?? null}
            onRefresh={refreshPortfolio}
            autoEditSignal={editSignals.contract}
          />
        </TabsContent>
        <TabsContent value="jv" className="mt-0 focus-visible:outline-none">
          <JointVenturePanel
            submission={data?.joint_venture ?? null}
            onRefresh={refreshPortfolio}
            autoEditSignal={editSignals.jv}
          />
        </TabsContent>
        <TabsContent value="interior" className="mt-0 focus-visible:outline-none">
          <InteriorPanel
            submission={data?.interior ?? null}
            onRefresh={refreshPortfolio}
            autoEditSignal={editSignals.interior}
          />
        </TabsContent>
        <TabsContent value="renovation" className="mt-0 focus-visible:outline-none">
          <RenovationPanel
            submission={data?.renovation_repaint ?? null}
            onRefresh={refreshPortfolio}
            autoEditSignal={editSignals.renovation}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
