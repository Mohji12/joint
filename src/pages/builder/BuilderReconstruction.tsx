import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Briefcase, ImageIcon, Users, LayoutGrid, IndianRupee } from "lucide-react";
import { getAccessToken, uploadFileAndGetUrl, upsertProfessionalProfileFromBuilderForm, submitBuilderReconstructionForm, getProfessionalProfile } from "@/lib/api";
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
import { ProjectMediaUpload } from "@/components/ProjectMediaUpload";

const PROJECT_CAPS = [
  "Residential Construction   Duplexes, villas, multi-story buildings",
  "Commercial Construction   Hotels, offices, schools, rental / PG spaces",
  "Industrial Construction   Warehouses, factories, industrial buildings",
];

const SUBCONTRACTOR_SCOPES = [
  "Civil Works",
  "Flooring & Finishing Works",
  "Painting & Surface Coatings",
  "Carpentry & Woodwork",
  "Other (please specify)",
];

const TYPICAL_SIZE_OPTIONS = ["Up to 500 sft", "500   2,500 sft", "2,500   10,000 sft", "10,000+ sft", "Other (Free text)"];

const WORK_TYPE_OPTIONS = [
  "Major Reconstruction / Renovation: Adding a new floor or room, full house repaint, structural modifications (walls, partitions)",
  "Minor Repair & Maintenance: Kitchen plumbing or water leakage repairs, bathroom flooring replacement, electrical or fixture repairs",
  "Painting & Finishing Works: Interior painting (walls, ceilings), exterior painting, surface coatings, touch-ups",
  "Other / Custom Work",
];

const RECENT_PROJECT_TYPE_OPTIONS = ["Residential", "Commercial", "Industrial", "Interior"];

const SECTIONS: StepFormSection[] = [
  { id: "basic", label: "Basic Details", icon: Building2 },
  { id: "capabilities", label: "Project Capabilities", icon: Briefcase },
  { id: "experience", label: "Experience & Portfolio", icon: ImageIcon },
  { id: "execution", label: "Execution Approach & Capacity", icon: Users },
  { id: "worktype", label: "Work Type Preferences", icon: LayoutGrid },
  { id: "pricing", label: "Tentative Pricing", icon: IndianRupee },
];

const BuilderReconstruction = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editProfileId = searchParams.get("edit");
  const [step, setStep] = useState<"brief" | "form" | "done">("brief");
  const [activeSectionId, setActiveSectionId] = useState(SECTIONS[0].id);
  const [companyName, setCompanyName] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [entityType, setEntityType] = useState("");
  const [builderLicense, setBuilderLicense] = useState("");
  const [reraRegistration, setReraRegistration] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [address, setAddress] = useState("");
  const [googleMapsAddress, setGoogleMapsAddress] = useState("");
  const [projectCaps, setProjectCaps] = useState<string[]>([]);
  const [preferredLocations, setPreferredLocations] = useState("");
  const [projectsCompleted, setProjectsCompleted] = useState("");
  const [similarProjectsDesc, setSimilarProjectsDesc] = useState("");
  const [recentProjects, setRecentProjects] = useState<
    Array<{ nameLocation: string; builtUpSft: string; type: string; durationMonths: string; images: File[]; video: File | null }>
  >([
    { nameLocation: "", builtUpSft: "", type: "", durationMonths: "", images: [], video: null },
    { nameLocation: "", builtUpSft: "", type: "", durationMonths: "", images: [], video: null },
    { nameLocation: "", builtUpSft: "", type: "", durationMonths: "", images: [], video: null },
  ]);
  const [teamType, setTeamType] = useState<"in-house" | "subcontractors" | "">("");
  const [subcontractorScopes, setSubcontractorScopes] = useState<string[]>([]);
  const [subOther, setSubOther] = useState("");
  const [typicalSize, setTypicalSize] = useState("");
  const [typicalSizeOther, setTypicalSizeOther] = useState("");
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [workTypeOther, setWorkTypeOther] = useState("");
  const [pricingNote, setPricingNote] = useState("");

  const toggleCap = (t: string) => {
    setProjectCaps((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };
  const toggleSub = (s: string) => {
    setSubcontractorScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };
  const toggleWork = (w: string) => {
    setWorkTypes((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]));
  };

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
            setPreferredLocations(profile.location_preferences?.join(", ") || "");
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
      const existing = list.find((p: Record<string, unknown>) => p.profileId === editProfileId && (p.type as string) === "reconstruction");
      if (!existing) return;
      const e = existing as Record<string, unknown>;
      setCompanyName((e.companyName as string) || "");
      setYearsExperience((e.yearsExperience as string) || "");
      setEntityType((e.entityType as string) || "");
      setBuilderLicense((e.builderLicense as string) || "");
      setReraRegistration((e.reraRegistration as string) || "");
      setGstNumber((e.gstNumber as string) || "");
      setAddress((e.address as string) || "");
      setGoogleMapsAddress((e.googleMapsAddress as string) || "");
      setProjectCaps(Array.isArray(e.projectCaps) ? (e.projectCaps as string[]) : []);
      setPreferredLocations((e.preferredLocations as string) || "");
      setProjectsCompleted((e.projectsCompleted as string) || "");
      setSimilarProjectsDesc((e.similarProjectsDesc as string) || "");
      setTeamType(((e.teamType as string) || "") as "in-house" | "subcontractors" | "");
      setSubcontractorScopes(Array.isArray(e.subcontractorScopes) ? (e.subcontractorScopes as string[]) : []);
      setSubOther((e.subcontractorOther as string) || "");
      setTypicalSize((e.typicalSize as string) || "");
      setTypicalSizeOther((e.typicalSizeOther as string) || "");
      setWorkTypes(Array.isArray(e.workTypes) ? (e.workTypes as string[]) : []);
      setWorkTypeOther((e.workTypeOther as string) || "");
      setPricingNote((e.pricingNote as string) || "");
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
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const basePayload = {
      company_name: companyName,
      years_experience: yearsExperience,
      address,
      project_caps: projectCaps,
      location: { address, googleMapsAddress: googleMapsAddress || undefined },
      scope_of_work: {
        teamType,
        subcontractorScopes,
        subcontractorOther: subOther,
        typicalSize,
        workTypes,
        workTypeOther,
        pricingNote,
      },
      work_types: workTypes,
      pricing: { note: pricingNote },
      projects_completed: projectsCompleted || undefined,
    };

    const token = getAccessToken();
    if (token) {
      setSubmitting(true);
      setSubmitError(null);
      try {
        await upsertProfessionalProfileFromBuilderForm({
          company_name: companyName,
          years_experience: yearsExperience,
          address,
          preferred_location: preferredLocations || undefined,
          capability_type: "RECONSTRUCTION",
        });
        const recentProjectsWithUrls = await Promise.all(
          recentProjects.map(async (p) => {
            const imageUrls: string[] = [];
            for (const file of p.images) {
              const url = await uploadFileAndGetUrl(file, "builder/reconstruction");
              imageUrls.push(url);
            }
            let videoUrl: string | undefined;
            if (p.video) {
              videoUrl = await uploadFileAndGetUrl(p.video, "builder/reconstruction");
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
        try {
          await submitBuilderReconstructionForm({
            ...basePayload,
            recent_projects: recentProjectsWithUrls,
          });
        } catch {
          // Form audit is best-effort
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
      profileId: editProfileId || `builder-${Date.now()}-reconstruction`,
      type: "reconstruction",
      companyName,
      yearsExperience,
      entityType,
      builderLicense: builderLicense || undefined,
      reraRegistration: reraRegistration || undefined,
      gstNumber: gstNumber || undefined,
      address,
      googleMapsAddress: googleMapsAddress || undefined,
      projectCaps,
      preferredLocations,
      projectsCompleted: projectsCompleted || undefined,
      similarProjectsDesc: similarProjectsDesc || undefined,
      recentProjects: recentProjects.map((p) => ({
        nameLocation: p.nameLocation,
        builtUpSft: p.builtUpSft,
        type: p.type,
        durationMonths: p.durationMonths,
        imageCount: p.images.length,
        hasVideo: !!p.video,
      })),
      teamType,
      subcontractorScopes,
      subcontractorOther: subOther || undefined,
      typicalSize,
      typicalSizeOther: typicalSizeOther || undefined,
      workTypes,
      workTypeOther: workTypeOther || undefined,
      pricingNote: pricingNote || undefined,
      submittedAt: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem("builderProfiles") || "[]");
    if (editProfileId) {
      const idx = existing.findIndex((p: Record<string, unknown>) => p.profileId === editProfileId);
      if (idx >= 0) existing[idx] = formData;
      else existing.push(formData);
    } else {
      existing.push(formData);
    }
    localStorage.setItem("builderProfiles", JSON.stringify(existing));
    setStep("done");
  };

  return (
    <div className="w-full overflow-x-hidden">
      <section className="relative py-6 sm:py-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 via-background to-background" />
        <div className="relative z-10 max-w-3xl mx-auto w-full">
          <Link to="/builder/options" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-12 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to options
          </Link>

          {step === "brief" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Renovation/Repaint / Painter</h1>
              <p className="text-foreground leading-relaxed">
                Renovation/Repaint work involves repairing, renovating, or painting existing structures. It is ideal for clients looking for maintenance, minor upgrades, or complete refurbishments.
              </p>
              <Button size="lg" onClick={() => setStep("form")}>Continue to form</Button>
            </motion.div>
          )}

          {step === "form" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Renovation/Repaint / Painter</h1>

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
                      Could you please provide the name of your construction company or sole proprietorship?
                    </Label>
                    <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company name" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      Could you kindly let us know how long your company has been in business, or your individual work experience?
                    </Label>
                    <Input value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} placeholder="e.g. 5 years" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Business entity type:</Label>
                    <Select value={entityType} onValueChange={setEntityType}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Individual">Individual</SelectItem>
                        <SelectItem value="Partnership">Partnership</SelectItem>
                        <SelectItem value="LLP">LLP</SelectItem>
                        <SelectItem value="Private Limited">Private Limited</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Licenses & Registrations (where applicable):</Label>
                    <div className="space-y-2">
                      <Input placeholder="Builder / Contractor License (e.g., KPWD or equivalent)" value={builderLicense} onChange={(e) => setBuilderLicense(e.target.value)} />
                      <Input placeholder="Relevant approvals including RERA registration" value={reraRegistration} onChange={(e) => setReraRegistration(e.target.value)} />
                      <Input placeholder="GST registration number" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Registered office / physical address in Bangalore:</Label>
                    <CityAreaInput value={address} onChange={setAddress} placeholder="Select area (e.g. HSR Layout, Whitefield)" className="mb-2" />
                    <Input value={googleMapsAddress} onChange={(e) => setGoogleMapsAddress(e.target.value)} placeholder="Google Maps location / link" className="text-sm text-muted-foreground" />
                  </div>
                  <BangaloreMap className="mt-4" height={320} area={address} />
                </div>
                )}

                {activeSectionId === "capabilities" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Which types of projects do you typically undertake? (Select all that apply)</Label>
                    <div className="space-y-2">
                      {PROJECT_CAPS.map((t) => (
                        <div key={t} className="flex items-center space-x-2">
                          <Checkbox id={`rec-cap-${t}`} checked={projectCaps.includes(t)} onCheckedChange={() => toggleCap(t)} />
                          <Label htmlFor={`rec-cap-${t}`} className="font-normal cursor-pointer text-sm">{t}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Preferred Project Locations:</Label>
                    <Textarea value={preferredLocations} onChange={(e) => setPreferredLocations(e.target.value)} placeholder="Multiple areas with radius in km (if needed)" rows={2} />
                  </div>
                </div>
                )}

                {activeSectionId === "experience" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">How many projects have you completed?</Label>
                    <Input value={projectsCompleted} onChange={(e) => setProjectsCompleted(e.target.value)} placeholder="Number" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      Have you handled similar reconstruction or repair projects before? If yes, please briefly describe:
                    </Label>
                    <Textarea value={similarProjectsDesc} onChange={(e) => setSimilarProjectsDesc(e.target.value)} placeholder="Brief description" rows={3} />
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Add details of your three most recent projects (3 images + 1 video per project; you can upload or take a live photo from camera):</Label>
                    {recentProjects.map((proj, idx) => (
                      <div key={idx} className="rounded-xl border border-border bg-card/50 p-4 space-y-3 mt-4">
                        <p className="text-sm font-medium text-muted-foreground">Project {idx + 1}</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <Label className="text-sm">Name / Location</Label>
                            <CityAreaInput value={proj.nameLocation} onChange={(v) => updateRecentProject(idx, "nameLocation", v)} placeholder="e.g. Villa, Koramangala" />
                          </div>
                          <div>
                            <Label className="text-sm">Built-up area (sft)</Label>
                            <Input value={proj.builtUpSft} onChange={(e) => updateRecentProject(idx, "builtUpSft", e.target.value)} placeholder="e.g. 2500" type="text" />
                          </div>
                          <div>
                            <Label className="text-sm">Type of building</Label>
                            <Select value={proj.type} onValueChange={(v) => updateRecentProject(idx, "type", v)}>
                              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {RECENT_PROJECT_TYPE_OPTIONS.map((o) => (
                                  <SelectItem key={o} value={o}>{o}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm">Duration (months)</Label>
                            <Input value={proj.durationMonths} onChange={(e) => updateRecentProject(idx, "durationMonths", e.target.value)} placeholder="e.g. 6" type="text" />
                          </div>
                        </div>
                        <ProjectMediaUpload
                          images={proj.images}
                          video={proj.video}
                          onImagesChange={(files) => updateRecentProject(idx, "images", files)}
                          onVideoChange={(file) => updateRecentProject(idx, "video", file)}
                          className="mt-3"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                )}

                {activeSectionId === "execution" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Team Structure:</Label>
                    <p className="text-sm text-muted-foreground mb-2">Do you typically execute projects with your in-house team or work with subcontractors?</p>
                    <RadioGroup value={teamType} onValueChange={(v) => setTeamType(v as "in-house" | "subcontractors")} className="space-y-2 mb-3">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="in-house" id="rec-inhouse" />
                        <Label htmlFor="rec-inhouse" className="font-normal cursor-pointer">In-house team</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="subcontractors" id="rec-sub" />
                        <Label htmlFor="rec-sub" className="font-normal cursor-pointer">Subcontractors</Label>
                      </div>
                    </RadioGroup>
                    {teamType === "subcontractors" && (
                      <div className="space-y-2 pl-4 mt-3">
                        <Label className="text-sm font-medium text-muted-foreground block">If subcontractors are involved, please indicate the scope of work outsourced:</Label>
                        {SUBCONTRACTOR_SCOPES.filter((s) => s !== "Other (please specify)").map((s) => (
                          <div key={s} className="flex items-center space-x-2">
                            <Checkbox id={`recsub-${s}`} checked={subcontractorScopes.includes(s)} onCheckedChange={() => toggleSub(s)} />
                            <Label htmlFor={`recsub-${s}`} className="font-normal cursor-pointer text-sm">{s}</Label>
                          </div>
                        ))}
                        <div className="flex items-center space-x-2">
                          <Checkbox id="recsub-other" checked={subcontractorScopes.includes("Other (please specify)")} onCheckedChange={() => toggleSub("Other (please specify)")} />
                          <Label htmlFor="recsub-other" className="font-normal cursor-pointer text-sm">Other (please specify)</Label>
                        </div>
                        {subcontractorScopes.includes("Other (please specify)") && (
                          <Input placeholder="Specify" value={subOther} onChange={(e) => setSubOther(e.target.value)} className="mt-2" />
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Typical Project Size Handled:</Label>
                    <Select value={typicalSize} onValueChange={setTypicalSize}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {TYPICAL_SIZE_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {typicalSize === "Other (Free text)" && (
                      <Input placeholder="Specify" value={typicalSizeOther} onChange={(e) => setTypicalSizeOther(e.target.value)} className="mt-2" />
                    )}
                  </div>
                </div>
                )}

                {activeSectionId === "worktype" && (
                <div className="space-y-6">
                  <p className="text-base text-foreground">How do you usually prefer your work type? (Select all that apply)</p>
                  <div className="space-y-2">
                    {WORK_TYPE_OPTIONS.filter((w) => w !== "Other / Custom Work").map((w) => (
                      <div key={w} className="flex items-center space-x-2">
                        <Checkbox id={`work-${w}`} checked={workTypes.includes(w)} onCheckedChange={() => toggleWork(w)} />
                        <Label htmlFor={`work-${w}`} className="font-normal cursor-pointer text-sm">{w}</Label>
                      </div>
                    ))}
                    <div className="flex items-start space-x-2">
                      <Checkbox id="work-other" checked={workTypes.includes("Other / Custom Work")} onCheckedChange={() => toggleWork("Other / Custom Work")} className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="work-other" className="font-normal cursor-pointer text-sm">Other / Custom Work:</Label>
                        {workTypes.includes("Other / Custom Work") && (
                          <Input placeholder="Free text for anything not covered above" value={workTypeOther} onChange={(e) => setWorkTypeOther(e.target.value)} className="mt-2" />
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    You can select multiple options or provide your own details to help us understand the full scope of services you offer.
                  </p>
                </div>
                )}

                {activeSectionId === "pricing" && (
                <div className="space-y-6">
                  <p className="text-base text-foreground">
                    To help us provide a clear and transparent view for landowners or property owners, could you kindly indicate your approximate pricing range for typical projects? (Reference only)
                  </p>
                  <Textarea value={pricingNote} onChange={(e) => setPricingNote(e.target.value)} placeholder="Per sft or total project   e.g. ₹/sft or total project range" rows={3} />
                </div>
                )}
              </StepFormLayout>

              {submitError && <p className="text-destructive text-sm mt-4">{submitError}</p>}
            </motion.div>
          )}

          {step === "done" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Profile Published!</h1>
              <div className="glass-card rounded-2xl p-6 md:p-8 border border-glass-border space-y-4">
                <p className="text-foreground leading-relaxed">
                  Your renovation/repaint profile is now live on Opportunities. Landowners can discover your services based on your location preferences and pricing.
                </p>
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
                  <p className="text-sm font-medium text-primary">Published to Opportunities</p>
                </div>
              </div>
              <Button size="lg" onClick={() => navigate("/builder/dashboard")}>Go to Dashboard</Button>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default BuilderReconstruction;
