import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Briefcase, ImageIcon, Users, LayoutGrid, IndianRupee, FileCheck, Hammer, Flag, ClipboardCheck, PackageCheck } from "lucide-react";
import { getAccessToken, uploadFileAndGetUrl, submitBuilderContractConstruction, upsertProfessionalProfileFromBuilderForm, getProfessionalProfile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StepFormLayout, type StepFormSection } from "@/components/StepFormLayout";
import { CityAreaInput } from "@/components/CityAreaInput";
import { BangaloreMap } from "@/components/BangaloreMap";
import { ConstructionPricingTable } from "@/components/ConstructionPricingTable";
import type { ConstructionPricingType } from "@/data/constructionPricingSpecs";
import {
  RESIDENTIAL_PACKAGES,
  COMMERCIAL_PACKAGES,
  INDUSTRIAL_PACKAGES,
  getDefaultResidentialPackages,
  getDefaultCommercialPackages,
  getDefaultIndustrialPackages,
  buildPricingPayload,
} from "@/data/constructionPricingSpecs";
import type { ResidentialPackageRow, CommercialPackageRow, IndustrialPackageRow } from "@/data/constructionPricingSpecs";
import { ProjectMediaUpload } from "@/components/ProjectMediaUpload";

const PROJECT_TYPES = [
  "Residential   Duplexes, villas, multi-story buildings",
  "Commercial   Hotels, offices, schools, rental/PG spaces",
  "Industrial   Warehouses, factories, industrial buildings",
  "Interior Design   Homes, commercial spaces, apartments",
];

const SUBCONTRACTOR_SCOPES = [
  "Civil Works",
  "Flooring & Finishing Works",
  "Painting & Surface Coatings",
  "Carpentry & Woodwork",
  "Other (Specify)",
];

const TYPICAL_SIZE_OPTIONS = [
  "Up to 5,000 sft",
  "5,000   25,000 sft",
  "25,000   1,00,000 sft",
  "1,00,000+ sft",
  "Other (Specify)",
];

const RECENT_PROJECT_TYPE_OPTIONS = ["Residential", "Commercial", "Industrial", "Interior"];

const SECTIONS: StepFormSection[] = [
  { id: "basic", label: "Basic Company Details", icon: Building2 },
  { id: "specialization", label: "Project Specialization", icon: Briefcase },
  { id: "experience", label: "Experience & Portfolio", icon: ImageIcon },
  { id: "execution", label: "Execution Model", icon: Users },
  { id: "capacity", label: "Project Capacity", icon: LayoutGrid },
  { id: "pricing", label: "Indicative Pricing", icon: IndianRupee },
];

const BuilderContractConstruction = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editProfileId = searchParams.get("edit");
  const [step, setStep] = useState<"brief" | "form" | "done">("brief");
  const [activeSectionId, setActiveSectionId] = useState(SECTIONS[0].id);
  const [companyName, setCompanyName] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [licenseRera, setLicenseRera] = useState("");
  const [address, setAddress] = useState("");
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [projectsCompleted, setProjectsCompleted] = useState("");
  const [teamType, setTeamType] = useState<"in-house" | "subcontractors" | "">("");
  const [subcontractorScopes, setSubcontractorScopes] = useState<string[]>([]);
  const [subcontractorOther, setSubcontractorOther] = useState("");
  const [typicalSize, setTypicalSize] = useState("");
  const [typicalSizeOther, setTypicalSizeOther] = useState("");
  const [pricingType, setPricingType] = useState<ConstructionPricingType | null>(null);
  const [residentialPackages, setResidentialPackages] = useState<ResidentialPackageRow[]>(getDefaultResidentialPackages());
  const [commercialPackages, setCommercialPackages] = useState<CommercialPackageRow[]>(getDefaultCommercialPackages());
  const [industrialPackages, setIndustrialPackages] = useState<IndustrialPackageRow[]>(getDefaultIndustrialPackages());
  const [recentProjects, setRecentProjects] = useState<
    Array<{ nameLocation: string; builtUpSft: string; type: string; durationMonths: string; images: File[]; video: File | null }>
  >([
    { nameLocation: "", builtUpSft: "", type: "", durationMonths: "", images: [], video: null },
    { nameLocation: "", builtUpSft: "", type: "", durationMonths: "", images: [], video: null },
    { nameLocation: "", builtUpSft: "", type: "", durationMonths: "", images: [], video: null },
  ]);

  const updateRecentProject = (index: number, field: string, value: string | File[] | File | null) => {
    setRecentProjects((prev) => {
      const next = [...prev];
      const proj = { ...next[index] };
      if (field === "images") proj.images = value as File[];
      else if (field === "video") proj.video = value as File | null;
      else (proj as Record<string, string>)[field] = value as string;
      next[index] = proj;
      return next;
    });
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!editProfileId) return;
    let cancelled = false;

    const loadFromApi = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          const profile = await getProfessionalProfile();
          if (cancelled) return;
          if (String(profile.id) === editProfileId) {
            setCompanyName(profile.company_name || "");
            setYearsExperience(profile.experience_years?.toString() || "");
            setAddress(profile.city || "");
            setPreferredLocations(profile.location_preferences || []);
            setStep("form");
            return;
          }
        } catch {
          // Fall through to localStorage
        }
      }

      const stored = localStorage.getItem("builderProfiles");
      if (!stored) return;
      const list = JSON.parse(stored);
      const existing = list.find((p: Record<string, unknown>) => p.profileId === editProfileId && (p.type as string) === "contract-construction");
      if (!existing) return;
      const e = existing as Record<string, unknown>;
      setCompanyName((e.companyName as string) || "");
      setYearsExperience((e.yearsExperience as string) || "");
      setLicenseRera((e.licenseRera as string) || "");
      setAddress((e.address as string) || "");
      setProjectTypes(Array.isArray(e.projectTypes) ? (e.projectTypes as string[]) : []);
      const storedPreferred = Array.isArray((e as { preferredLocations?: unknown }).preferredLocations)
        ? (((e as { preferredLocations?: unknown }).preferredLocations) as string[])
        : ((e.preferredLocation as string) ? [e.preferredLocation as string] : []);
      setPreferredLocations(storedPreferred);
      setProjectsCompleted((e.projectsCompleted as string) || "");
      setTeamType(((e.teamType as string) || "") as "in-house" | "subcontractors" | "");
      setSubcontractorScopes(Array.isArray(e.subcontractorScopes) ? (e.subcontractorScopes as string[]) : []);
      setSubcontractorOther((e.subcontractorOther as string) || "");
      setTypicalSize((e.typicalSize as string) || "");
      setTypicalSizeOther((e.typicalSizeOther as string) || "");
      const pricing = e.pricing as Record<string, Record<string, Record<string, string>>> | undefined;
      if (pricing?.residential) {
        setResidentialPackages((prev) =>
          prev.map((r) => ({ ...r, ...pricing.residential?.[r.id] }))
        );
      }
      if (pricing?.commercial) {
        setCommercialPackages((prev) =>
          prev.map((r) => ({ ...r, ...pricing.commercial?.[r.id] }))
        );
      }
      if (pricing?.industrial) {
        setIndustrialPackages((prev) =>
          prev.map((r) => ({ ...r, ...pricing.industrial?.[r.id] }))
        );
      }
      const rp = (e.recentProjects as Array<Record<string, unknown>>) || [];
      setRecentProjects(
        [0, 1, 2].map((i) => ({
          nameLocation: (rp[i]?.nameLocation as string) || "",
          builtUpSft: (rp[i]?.builtUpSft as string) || "",
          type: (rp[i]?.type as string) || "",
          durationMonths: (rp[i]?.durationMonths as string) || "",
          images: [],
          video: null,
        }))
      );
      setStep("form");
    };

    loadFromApi();
    return () => { cancelled = true; };
  }, [editProfileId]);

  const handleSubmit = async () => {
    const token = getAccessToken();
    if (token) {
      setSubmitting(true);
      setSubmitError(null);
      try {
        const recentProjectsWithUrls = await Promise.all(
          recentProjects.map(async (p) => {
            const imageUrls: string[] = [];
            for (const file of p.images) {
              const url = await uploadFileAndGetUrl(file, "builder/contract");
              imageUrls.push(url);
            }
            let videoUrl: string | undefined;
            if (p.video) {
              videoUrl = await uploadFileAndGetUrl(p.video, "builder/contract");
            }
            return {
              name_location: p.nameLocation || undefined,
              built_up_sft: p.builtUpSft || undefined,
              type: p.type || undefined,
              duration_months: p.durationMonths || undefined,
              image_urls: imageUrls,
              video_url: videoUrl,
            };
          })
        );
        await upsertProfessionalProfileFromBuilderForm({
          company_name: companyName,
          years_experience: yearsExperience,
          address,
          preferred_locations_list: preferredLocations,
          capability_type: "CONSTRUCTION",
        });
        try {
          await submitBuilderContractConstruction({
            company_name: companyName,
            years_experience: yearsExperience,
            license_rera: licenseRera || undefined,
            address,
            project_types: projectTypes,
            preferred_location: preferredLocations.length ? preferredLocations.join(", ") : undefined,
            projects_completed: projectsCompleted || undefined,
            project_details: undefined,
            team_type: teamType || undefined,
            subcontractor_scopes: subcontractorScopes,
            subcontractor_other: subcontractorScopes.includes("Other (Specify)") ? subcontractorOther : undefined,
            typical_size: typicalSize || undefined,
            typical_size_other: typicalSize === "Other (Specify)" ? typicalSizeOther : undefined,
            pricing: buildPricingPayload(residentialPackages, commercialPackages, industrialPackages),
            project_image_urls: [],
            recent_projects: recentProjectsWithUrls,
          });
        } catch {
          // Form audit is best-effort; profile already created
        }
        setStep("done");
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "Submit failed");
      } finally {
        setSubmitting(false);
      }
      return;
    }
    const formData = {
      profileId: editProfileId || `builder-${Date.now()}-contract`,
      type: "contract-construction",
      companyName,
      yearsExperience,
      licenseRera,
      address,
      projectTypes,
      preferredLocations,
      preferredLocation: preferredLocations.join(", "),
      projectsCompleted,
      teamType,
      subcontractorScopes,
      subcontractorOther,
      typicalSize,
      typicalSizeOther,
      pricing: buildPricingPayload(residentialPackages, commercialPackages, industrialPackages),
      recentProjects: recentProjects.map((p) => ({ nameLocation: p.nameLocation, builtUpSft: p.builtUpSft, type: p.type, durationMonths: p.durationMonths, imageCount: p.images.length, hasVideo: !!p.video })),
      submittedAt: new Date().toISOString(),
    };
    const existingProfiles = JSON.parse(localStorage.getItem("builderProfiles") || "[]");
    if (editProfileId) {
      const idx = existingProfiles.findIndex((p: Record<string, unknown>) => p.profileId === editProfileId);
      if (idx >= 0) existingProfiles[idx] = formData;
      else existingProfiles.push(formData);
    } else {
      existingProfiles.push(formData);
    }
    localStorage.setItem("builderProfiles", JSON.stringify(existingProfiles));
    setStep("done");
  };

  const toggleProjectType = (t: string) => {
    setProjectTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };
  const toggleSubcontractorScope = (s: string) => {
    setSubcontractorScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  return (
    <div className="w-full overflow-x-hidden">
      <section className="relative py-6 sm:py-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 via-background to-background" />
        <div className="relative z-10 max-w-3xl mx-auto w-full">
          <Link
            to="/builder/options"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-12 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to options
          </Link>

          {step === "brief" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Contract construction</h1>
              <div className="p-6 md:p-8 space-y-6">
                <p className="text-foreground leading-relaxed">
                  Projects are executed under a clear legal contract defining scope, cost, timelines, and quality standards ensuring smooth delivery and transparency.
                </p>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Contract Construction Workflow</h3>
                  <ul className="space-y-3 text-sm text-foreground">
                    {[
                      { icon: FileCheck, title: "Contract Finalization", desc: "Scope, cost, and timelines agreed." },
                      { icon: Hammer, title: "Execution", desc: "Follow approved plans and standards." },
                      { icon: Flag, title: "Milestones", desc: "Progress in stages with clear payments." },
                      { icon: ClipboardCheck, title: "Quality Check", desc: "Ensure compliance and standards." },
                      { icon: PackageCheck, title: "Handover", desc: "Timely delivery with documented closure." },
                    ].map(({ icon: Icon, title, desc }, i) => (
                      <li key={i} className="flex items-start gap-3 list-none">
                        <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                          <Icon className="w-4 h-4" />
                        </span>
                        <span>
                          <strong className="text-foreground font-medium">{title}</strong>
                          {" "}
                          <span className="text-foreground">{desc}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button size="lg" onClick={() => setStep("form")} className="self-start">
                  Continue to form
                </Button>
              </div>
            </motion.div>
          )}

          {step === "form" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Contract Construction</h1>

              <StepFormLayout
                sections={SECTIONS}
                activeSectionId={activeSectionId}
                onePagePerSection
                onPrev={() => {
                  const idx = SECTIONS.findIndex((s) => s.id === activeSectionId);
                  if (idx <= 0) setStep("brief");
                  else setActiveSectionId(SECTIONS[idx - 1].id);
                }}
                onNext={() => {
                  const idx = SECTIONS.findIndex((s) => s.id === activeSectionId);
                  if (idx < SECTIONS.length - 1) setActiveSectionId(SECTIONS[idx + 1].id);
                }}
                onSubmit={handleSubmit}
                submitLabel="Publish to Opportunities"
                submittingLabel="Publishing…"
                submitDisabled={submitting}
                isSubmitting={submitting}
              >
                {activeSectionId === "basic" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      Name of your construction company / sole proprietor?
                    </Label>
                    <Input
                      placeholder="Company or sole proprietor name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      How many years of company existence / individual work experience?
                    </Label>
                    <Input
                      placeholder="Years"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      If available, provide your Builder/Contractor License (e.g., KPWD or equivalent) and relevant approvals such as RERA registration.
                    </Label>
                    <Input placeholder="License / RERA details" value={licenseRera} onChange={(e) => setLicenseRera(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      Please provide the registered office or physical address in Bangalore.
                    </Label>
                    <CityAreaInput placeholder="Select area (e.g. HSR Layout, Whitefield)" value={address} onChange={setAddress} />
                  </div>
                  <BangaloreMap className="mt-4" height={320} area={address} />
                </div>
                )}

                {activeSectionId === "specialization" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      What type of construction projects do you work on or specialize in? (Select all that apply)
                    </Label>
                    <div className="space-y-2">
                      {PROJECT_TYPES.map((t) => (
                        <div key={t} className="flex items-center space-x-2">
                          <Checkbox id={`pt-${t}`} checked={projectTypes.includes(t)} onCheckedChange={() => toggleProjectType(t)} />
                          <Label htmlFor={`pt-${t}`} className="font-normal cursor-pointer text-sm">{t}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Preferred project location to work on?</Label>
                    <CityAreaInput
                      multiple
                      placeholder="Select preferred areas (e.g. HSR Layout, Whitefield)"
                      values={preferredLocations}
                      onValuesChange={setPreferredLocations}
                    />
                  </div>
                </div>
                )}

                {activeSectionId === "experience" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">How many projects have you completed?</Label>
                    <Input
                      placeholder="Total number of projects completed"
                      value={projectsCompleted}
                      onChange={(e) => setProjectsCompleted(e.target.value)}
                      className="max-w-xs mb-4"
                    />
                    <Label className="text-base font-semibold mb-3 block">Details of 3 most recent projects (3 images + 1 video each; you can upload or take a live photo from camera):</Label>
                    {recentProjects.map((proj, idx) => (
                      <div key={idx} className="border border-border rounded-lg p-4 mb-4 space-y-3">
                        <p className="text-sm font-medium text-foreground">Project {idx + 1}</p>
                        <CityAreaInput placeholder="Name / Location (e.g. HSR Layout, Koramangala)" value={proj.nameLocation} onChange={(v) => updateRecentProject(idx, "nameLocation", v)} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm text-muted-foreground mb-1 block">Built-up Area (sft)</Label>
                            <Input placeholder="Built-up Area (sft)" value={proj.builtUpSft} onChange={(e) => updateRecentProject(idx, "builtUpSft", e.target.value)} />
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground mb-1 block">Type of Building</Label>
                            <Select value={proj.type} onValueChange={(v) => updateRecentProject(idx, "type", v)}>
                              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                              <SelectContent>
                                {RECENT_PROJECT_TYPE_OPTIONS.map((o) => (
                                  <SelectItem key={o} value={o}>{o}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Input placeholder="Duration (months)" value={proj.durationMonths} onChange={(e) => updateRecentProject(idx, "durationMonths", e.target.value)} className="max-w-xs" />
                        <ProjectMediaUpload
                          images={proj.images}
                          video={proj.video}
                          onImagesChange={(files) => updateRecentProject(idx, "images", files)}
                          onVideoChange={(file) => updateRecentProject(idx, "video", file)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                )}

                {activeSectionId === "execution" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      Do you execute projects with an in-house team or engage subcontractors?
                    </Label>
                    <RadioGroup value={teamType} onValueChange={(v) => setTeamType(v as "in-house" | "subcontractors")} className="space-y-2 mb-3">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="in-house" id="team-inhouse" />
                        <Label htmlFor="team-inhouse" className="font-normal cursor-pointer">In-house team</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="subcontractors" id="team-sub" />
                        <Label htmlFor="team-sub" className="font-normal cursor-pointer">Subcontractors</Label>
                      </div>
                    </RadioGroup>
                    {teamType === "subcontractors" && (
                      <div className="space-y-2 pl-4 mt-3">
                        <Label className="text-sm font-medium text-muted-foreground block">If subcontractors are used, specify the scope of work outsourced:</Label>
                        {SUBCONTRACTOR_SCOPES.filter((s) => s !== "Other (Specify)").map((s) => (
                          <div key={s} className="flex items-center space-x-2">
                            <Checkbox id={`sub-${s}`} checked={subcontractorScopes.includes(s)} onCheckedChange={() => toggleSubcontractorScope(s)} />
                            <Label htmlFor={`sub-${s}`} className="font-normal cursor-pointer text-sm">{s}</Label>
                          </div>
                        ))}
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="sub-other"
                            checked={subcontractorScopes.includes("Other (Specify)")}
                            onCheckedChange={() => toggleSubcontractorScope("Other (Specify)")}
                          />
                          <Label htmlFor="sub-other" className="font-normal cursor-pointer text-sm">Other (Specify)</Label>
                        </div>
                        {subcontractorScopes.includes("Other (Specify)") && (
                          <Input placeholder="Specify" value={subcontractorOther} onChange={(e) => setSubcontractorOther(e.target.value)} className="mt-2" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                )}

                {activeSectionId === "capacity" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      Please indicate the approximate built-up area (in square feet) you usually handle per project:
                    </Label>
                    <Select value={typicalSize} onValueChange={setTypicalSize}>
                      <SelectTrigger><SelectValue placeholder="Select one" /></SelectTrigger>
                      <SelectContent>
                        {TYPICAL_SIZE_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {typicalSize === "Other (Specify)" && (
                      <Input placeholder="Specify" value={typicalSizeOther} onChange={(e) => setTypicalSizeOther(e.target.value)} className="mt-2" />
                    )}
                  </div>
                </div>
                )}

                {activeSectionId === "pricing" && (
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Choose a construction type and fill the specification table. You can switch and fill more than one. Figures are for reference only.
                  </p>
                  <RadioGroup
                    value={pricingType ?? ""}
                    onValueChange={(v) => setPricingType(v === "" ? null : (v as ConstructionPricingType))}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="residential" id="pricing-residential" />
                      <Label htmlFor="pricing-residential" className="cursor-pointer font-normal">Contract Construction (Residential)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="commercial" id="pricing-commercial" />
                      <Label htmlFor="pricing-commercial" className="cursor-pointer font-normal">Commercial Construction</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="industrial" id="pricing-industrial" />
                      <Label htmlFor="pricing-industrial" className="cursor-pointer font-normal">Industrial Construction</Label>
                    </div>
                  </RadioGroup>
                  {pricingType === "residential" && (
                    <ConstructionPricingTable
                      constructionType="residential"
                      packages={RESIDENTIAL_PACKAGES}
                      rows={residentialPackages}
                      onRowsChange={setResidentialPackages}
                    />
                  )}
                  {pricingType === "commercial" && (
                    <ConstructionPricingTable
                      constructionType="commercial"
                      packages={COMMERCIAL_PACKAGES}
                      rows={commercialPackages}
                      onRowsChange={setCommercialPackages}
                    />
                  )}
                  {pricingType === "industrial" && (
                    <ConstructionPricingTable
                      constructionType="industrial"
                      packages={INDUSTRIAL_PACKAGES}
                      rows={industrialPackages}
                      onRowsChange={setIndustrialPackages}
                    />
                  )}
                </div>
                )}
              </StepFormLayout>

              {submitError && (
                <p className="text-destructive text-sm mt-4">{submitError}</p>
              )}
            </motion.div>
          )}

          {step === "done" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Profile Published!</h1>
              <div className="glass-card rounded-2xl p-6 md:p-8 border border-glass-border space-y-4">
                <p className="text-foreground leading-relaxed">
                  Your builder profile is now live on Opportunities. Landowners can discover your services based on your location preferences, pricing range, and areas of expertise.
                </p>
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
                  <p className="text-sm font-medium text-primary">Published to Opportunities</p>
                  <p className="text-sm text-muted-foreground mt-1">We will match you with relevant projects.</p>
                </div>
              </div>
              <Button size="lg" onClick={() => navigate("/builder/dashboard")} className="w-full sm:w-auto">
                Go to Dashboard
              </Button>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default BuilderContractConstruction;
