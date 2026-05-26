import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Briefcase, ImageIcon, IndianRupee, MapPin } from "lucide-react";
import { getAccessToken, uploadFileAndGetUrl, upsertProfessionalProfileFromBuilderForm, submitBuilderInteriorForm, getProfessionalProfile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepFormLayout, type StepFormSection } from "@/components/StepFormLayout";
import { CityAreaInput } from "@/components/CityAreaInput";
import { BangaloreMap } from "@/components/BangaloreMap";
import { ProjectMediaUpload } from "@/components/ProjectMediaUpload";

const PROJECT_TYPES = [
  "Residential   Duplex houses, villas, flats",
  "Commercial   Hotels, office spaces, schools, rental / PG",
  "Industrial   Warehouses, factories, industrial buildings",
];

const PROJECT_TYPE_OPTIONS = ["Residential", "Commercial", "Industrial"];

const SECTIONS: StepFormSection[] = [
  { id: "company", label: "Company Details", icon: Building2 },
  { id: "types", label: "Types of Projects", icon: Briefcase },
  { id: "experience", label: "Previous Project Experience", icon: ImageIcon },
  { id: "pricing", label: "Tentative Pricing", icon: IndianRupee },
  { id: "locations", label: "Preferred Project Locations", icon: MapPin },
];

const BuilderInterior = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editProfileId = searchParams.get("edit");
  const [step, setStep] = useState<"brief" | "form" | "done">("brief");
  const [activeSectionId, setActiveSectionId] = useState(SECTIONS[0].id);
  const [companyName, setCompanyName] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [address, setAddress] = useState("");
  const [googleMapsAddress, setGoogleMapsAddress] = useState("");
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [endToEndOrPartial, setEndToEndOrPartial] = useState("");
  const [approximatePricing, setApproximatePricing] = useState("");
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);

  const [recentProjects, setRecentProjects] = useState<
    Array<{ location: string; type: string; builtUpSft: string; durationMonths: string; images: File[]; video: File | null }>
  >([
    { location: "", type: "", builtUpSft: "", durationMonths: "", images: [], video: null },
    { location: "", type: "", builtUpSft: "", durationMonths: "", images: [], video: null },
    { location: "", type: "", builtUpSft: "", durationMonths: "", images: [], video: null },
  ]);

  const toggleType = (t: string) => {
    setProjectTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
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
            if (profile.location_preferences?.length) {
              setPreferredLocations(profile.location_preferences);
            }
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
      const existing = list.find((p: Record<string, unknown>) => p.profileId === editProfileId && (p.type as string) === "interior");
      if (!existing) return;
      const e = existing as Record<string, unknown>;
      setCompanyName((e.companyName as string) || "");
      setYearsExperience((e.yearsExperience as string) || "");
      setAddress((e.address as string) || "");
      setGoogleMapsAddress((e.googleMapsAddress as string) || "");
      setProjectTypes(Array.isArray(e.projectTypes) ? (e.projectTypes as string[]) : []);
      setEndToEndOrPartial((e.endToEndOrPartial as string) || "");
      const legacyParts = [
        e.price1200 as string | undefined,
        e.price1500 as string | undefined,
        e.price1800 as string | undefined,
        e.priceOther as string | undefined,
      ]
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .filter(Boolean);
      const mergedLegacy = legacyParts.join(" · ");
      setApproximatePricing(
        (e.approximatePricing as string)?.trim() ||
          mergedLegacy ||
          ""
      );
      const storedPreferred = Array.isArray((e as { preferredLocations?: unknown }).preferredLocations)
        ? ((e as { preferredLocations?: string[] }).preferredLocations || [])
        : [e.loc1, e.loc2, e.loc3].filter((v): v is string => typeof v === "string" && v.trim().length > 0);
      setPreferredLocations(storedPreferred);
      const rp = (e.recentProjects as Array<Record<string, unknown>>) || [];
      setRecentProjects(
        [0, 1, 2].map((i) => ({
          location: (rp[i]?.location as string) || "",
          type: (rp[i]?.type as string) || "",
          builtUpSft: (rp[i]?.builtUpSft as string) || "",
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
    const basePayload = {
      company_name: companyName,
      years_experience: yearsExperience,
      address,
      project_types: projectTypes,
      location: { address: address, googleMapsAddress: googleMapsAddress || undefined },
      project_scope: { endToEndOrPartial },
      pricing: { approximate: approximatePricing.trim() || undefined },
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
          capability_type: "INTERIOR",
        });
        const recentProjectsWithUrls = await Promise.all(
          recentProjects.map(async (p) => {
            const imageUrls: string[] = [];
            for (const file of p.images) {
              const url = await uploadFileAndGetUrl(file, "builder/interior");
              imageUrls.push(url);
            }
            let videoUrl: string | undefined;
            if (p.video) {
              videoUrl = await uploadFileAndGetUrl(p.video, "builder/interior");
            }
            return {
              location: p.location || undefined,
              type: p.type || undefined,
              built_up_sft: p.builtUpSft || undefined,
              duration_months: p.durationMonths || undefined,
              image_urls: imageUrls,
              video_url: videoUrl,
            };
          })
        );
        try {
          await submitBuilderInteriorForm({
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
      profileId: editProfileId || `builder-${Date.now()}-interior`,
      type: "interior",
      companyName,
      yearsExperience,
      address,
      googleMapsAddress: googleMapsAddress || undefined,
      projectTypes,
      endToEndOrPartial: endToEndOrPartial || undefined,
      recentProjects: recentProjects.map((p) => ({
        location: p.location,
        type: p.type,
        builtUpSft: p.builtUpSft,
        durationMonths: p.durationMonths,
        imageCount: p.images.length,
        hasVideo: !!p.video,
      })),
      approximatePricing: approximatePricing.trim() || undefined,
      preferredLocations,
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
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Interior Architect / Designer</h1>
              <p className="text-foreground leading-relaxed">
                Interior architecture and design involve planning and enhancing interior spaces to maximize functionality, aesthetics, and comfort. This includes layout planning, selection of materials and finishes, and coordination during execution, ensuring spaces are both beautiful and practical.
              </p>
              <Button size="lg" onClick={() => setStep("form")}>Continue to form</Button>
            </motion.div>
          )}

          {step === "form" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Interior Architect / Designer</h1>

              <StepFormLayout
                sections={SECTIONS}
                activeSectionId={activeSectionId}
                onePagePerSection
                alwaysShowSubmit
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
                submitLabel="Save"
                submitDisabled={submitting}
                isSubmitting={submitting}
              >
                {activeSectionId === "company" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      Could you please provide the name of your company or sole proprietorship?
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
                    <Label className="text-base font-semibold mb-2 block">
                      Could you kindly share your office or physical address?
                    </Label>
                    <CityAreaInput value={address} onChange={setAddress} placeholder="Select area (e.g. HSR Layout, Whitefield)" className="mb-2" />
                    <Input value={googleMapsAddress} onChange={(e) => setGoogleMapsAddress(e.target.value)} placeholder="Optional: Google Maps location / link" className="text-sm text-muted-foreground" />
                  </div>
                  <BangaloreMap className="mt-4" height={320} area={address} />
                </div>
                )}

                {activeSectionId === "types" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      Which types of projects do you typically undertake? (Select all that apply)
                    </Label>
                    <div className="space-y-2">
                      {PROJECT_TYPES.map((t) => (
                        <div key={t} className="flex items-center space-x-2">
                          <Checkbox id={`int-${t}`} checked={projectTypes.includes(t)} onCheckedChange={() => toggleType(t)} />
                          <Label htmlFor={`int-${t}`} className="font-normal cursor-pointer text-sm">{t}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">End-to-end or specific work?</Label>
                    <Select value={endToEndOrPartial} onValueChange={setEndToEndOrPartial}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="End-to-end">End-to-end project</SelectItem>
                        <SelectItem value="Specific work">Specific work only</SelectItem>
                        <SelectItem value="Both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                )}

                {activeSectionId === "experience" && (
                <div className="space-y-6">
                  <p className="text-base text-foreground">
                    Could you please provide details of your last 3 completed projects, with 3 images and 1 video per project? You can upload files or take a live photo from your camera.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    For each project, include: Location, Type of Project, Built-up Area (sft), Duration (months), 3 images, and 1 video.
                  </p>
                  {recentProjects.map((proj, idx) => (
                    <div key={idx} className="border border-border rounded-xl p-4 space-y-3 bg-card/50">
                      <p className="text-sm font-medium text-foreground">Project {idx + 1}</p>
                      <div>
                        <Label className="text-sm text-muted-foreground mb-1 block">Location</Label>
                        <CityAreaInput placeholder="Area (e.g. HSR Layout, Koramangala)" value={proj.location} onChange={(v) => updateRecentProject(idx, "location", v)} />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground mb-1 block">Type of Project</Label>
                        <Select value={proj.type} onValueChange={(v) => updateRecentProject(idx, "type", v)}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {PROJECT_TYPE_OPTIONS.map((o) => (
                              <SelectItem key={o} value={o}>{o}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label className="text-sm text-muted-foreground mb-1 block">Built-up Area (sft)</Label>
                          <Input placeholder="sft" value={proj.builtUpSft} onChange={(e) => updateRecentProject(idx, "builtUpSft", e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground mb-1 block">Duration (months)</Label>
                          <Input placeholder="months" value={proj.durationMonths} onChange={(e) => updateRecentProject(idx, "durationMonths", e.target.value)} />
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
                )}

                {activeSectionId === "pricing" && (
                <div className="space-y-6">
                  <p className="text-base text-foreground">
                    To help us provide a clear and transparent view for landowners or property owners, could you kindly indicate your tentative starting price for typical projects? (Approximate starting price for reference only)
                  </p>
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                    <p className="text-sm font-medium text-foreground">Examples (for your reference — one field below)</p>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-2">
                      <li>1200 sft flat — end-to-end interior including 2 wooden cupboards, false ceiling, and kitchen countertop (complete set)</li>
                      <li>1500 sft duplex — living, bedrooms, and kitchen including 2 wooden wardrobes, false ceiling, and wardrobe units (complete set)</li>
                      <li>1800 sft commercial / office — fit-out including false ceiling, reception desk, and basic partitions (complete set)</li>
                      <li>Other project types — add any note or range you typically work with</li>
                    </ul>
                  </div>
                  <div>
                    <Label htmlFor="interior-approx-pricing" className="mb-1 block text-sm font-medium">
                      Approximate amount or range for typical projects
                    </Label>
                    <Input
                      id="interior-approx-pricing"
                      placeholder="e.g. ₹12L–18L for a 1200 sft flat, or ₹X/sft"
                      value={approximatePricing}
                      onChange={(e) => setApproximatePricing(e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    We understand that costs can vary depending on scope, materials, and project type, so these are just reference numbers. Feel free to provide any additional context or ranges you typically work with.
                  </p>
                </div>
                )}

                {activeSectionId === "locations" && (
                <div className="space-y-6">
                  <p className="text-base text-foreground">
                    Which locations are you most comfortable working in? You may select multiple areas.
                  </p>
                  <CityAreaInput
                    multiple
                    placeholder="Select area (e.g. HSR Layout, Koramangala, Whitefield)"
                    values={preferredLocations}
                    onValuesChange={setPreferredLocations}
                  />
                  <p className="text-sm text-muted-foreground italic">
                    Select from suggestions to lock each area. You can continue typing to add more.
                  </p>
                </div>
                )}
              </StepFormLayout>

              {submitError && <p className="text-destructive text-sm mt-4">{submitError}</p>}
            </motion.div>
          )}

          {step === "done" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Thank you</h1>
              <div className="glass-card rounded-2xl p-6 md:p-8 border border-glass-border space-y-4">
                <p className="text-foreground leading-relaxed">
                  After collecting the required information, we assign a credibility score and align you with suitable landowners or property owners based on your location preferences, pricing range, and areas of expertise.
                </p>
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
                  <p className="text-sm font-medium text-primary">Profile submitted</p>
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

export default BuilderInterior;
