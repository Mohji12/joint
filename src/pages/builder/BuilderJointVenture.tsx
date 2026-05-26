import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, X, Building2, FileCheck, MapPin, Briefcase, ImageIcon, Banknote, MapPinned, Users, Handshake } from "lucide-react";
import {
  getAccessToken,
  uploadFileAndGetUrl,
  submitBuilderJointVenture,
  upsertProfessionalProfileFromBuilderForm,
  getProfessionalProfile,
} from "@/lib/api";
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
// Pricing step removed from this form (was section 10).

const PROJECT_CAPS = [
  "Residential Construction",
  "Commercial Construction",
  "Industrial Construction",
];

const PROJECT_SCALE_OPTIONS = [
  "Up to ₹5 Cr",
  "₹5   20 Cr",
  "₹20   50 Cr",
  "Above ₹50 Cr",
];

const TEAM_SIZE_OPTIONS = [
  "Small (1 20 members)",
  "Medium (21 50 members)",
  "Large (51 100 members)",
  "Very Large (100+ members)",
];

const JV_ARRANGEMENT_OPTIONS = [
  "Revenue Sharing",
  "Built-up Area Sharing",
  "Sell and Share Entire Project",
];

const PROJECT_TYPE_OPTIONS = ["Residential", "Commercial", "Industrial", "Interior"];

const SECTIONS: StepFormSection[] = [
  { id: "basic", label: "Basic Details", icon: Building2 },
  { id: "licenses", label: "Licenses & Registrations", icon: FileCheck },
  { id: "office", label: "Office Location", icon: MapPin },
  { id: "capabilities", label: "Project Capabilities", icon: Briefcase },
  { id: "experience", label: "Experience & Portfolio", icon: ImageIcon },
  { id: "scale", label: "Financial Project Scale", icon: Banknote },
  { id: "location", label: "Location Radius", icon: MapPinned },
  { id: "team", label: "Team Strength", icon: Users },
  { id: "arrangement", label: "JV/JD Arrangement Type", icon: Handshake },
];

const BuilderJointVenture = () => {
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
  const [projectCaps, setProjectCaps] = useState<string[]>([]);
  const [preferredLocations, setPreferredLocations] = useState("");
  const [projectsCompleted, setProjectsCompleted] = useState("");
  const [reraYesNo, setReraYesNo] = useState<"yes" | "no" | "">("");
  const [reraProjects, setReraProjects] = useState("");
  const [projectScale, setProjectScale] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [jvArrangements, setJvArrangements] = useState<string[]>([]);
  const [location1, setLocation1] = useState("");
  const [radius1, setRadius1] = useState("");
  const [location2, setLocation2] = useState("");
  const [radius2, setRadius2] = useState("");
  const [location3, setLocation3] = useState("");
  const [radius3, setRadius3] = useState("");
  const [recentProjects, setRecentProjects] = useState<
    Array<{ nameLocation: string; builtUpSft: string; type: string; durationMonths: string; images: File[]; video: File | null }>
  >([
    { nameLocation: "", builtUpSft: "", type: "", durationMonths: "", images: [], video: null },
    { nameLocation: "", builtUpSft: "", type: "", durationMonths: "", images: [], video: null },
    { nameLocation: "", builtUpSft: "", type: "", durationMonths: "", images: [], video: null },
  ]);

  const toggleProjectCap = (t: string) => {
    setProjectCaps((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };
  const toggleJv = (j: string) => {
    setJvArrangements((prev) => (prev.includes(j) ? prev.filter((x) => x !== j) : [...prev, j]));
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
      const existing = list.find((p: Record<string, unknown>) => p.profileId === editProfileId && (p.type as string) === "joint-venture");
      if (!existing) return;
      const e = existing as Record<string, unknown>;
      setCompanyName((e.companyName as string) || "");
      setYearsExperience((e.yearsExperience as string) || "");
      setEntityType((e.entityType as string) || "");
      setBuilderLicense((e.builderLicense as string) || "");
      setReraRegistration((e.reraRegistration as string) || "");
      setGstNumber((e.gstNumber as string) || "");
      setAddress((e.address as string) || "");
      setProjectCaps(Array.isArray(e.projectCaps) ? (e.projectCaps as string[]) : []);
      setPreferredLocations((e.preferredLocations as string) || "");
      setProjectsCompleted((e.projectsCompleted as string) || "");
      setReraYesNo(((e.reraYesNo as string) || "") as "yes" | "no" | "");
      setReraProjects((e.reraProjects as string) || "");
      setProjectScale((e.projectScale as string) || "");
      setTeamSize((e.teamSize as string) || "");
      setJvArrangements(Array.isArray(e.jvArrangements) ? (e.jvArrangements as string[]) : []);
      const pricing = e.pricing as Record<string, Record<string, Record<string, string>>> | undefined;
      if (pricing?.residential) {
        setResidentialPackages((prev) => prev.map((r) => ({ ...r, ...pricing.residential?.[r.id] })));
      }
      if (pricing?.commercial) {
        setCommercialPackages((prev) => prev.map((r) => ({ ...r, ...pricing.commercial?.[r.id] })));
      }
      if (pricing?.industrial) {
        setIndustrialPackages((prev) => prev.map((r) => ({ ...r, ...pricing.industrial?.[r.id] })));
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
              const url = await uploadFileAndGetUrl(file, "builder/jv");
              imageUrls.push(url);
            }
            let videoUrl: string | undefined;
            if (p.video) {
              videoUrl = await uploadFileAndGetUrl(p.video, "builder/jv");
            }
            return {
              name_location: p.nameLocation,
              built_up_sft: p.builtUpSft,
              type: p.type,
              duration_months: p.durationMonths,
              image_urls: imageUrls,
              video_url: videoUrl,
            };
          })
        );
        await upsertProfessionalProfileFromBuilderForm({
          company_name: companyName,
          years_experience: yearsExperience,
          entity_type: entityType || undefined,
          gst_number: gstNumber || undefined,
          address,
          project_caps: projectCaps,
          preferred_locations: preferredLocations || undefined,
          location1: location1 || undefined,
          location2: location2 || undefined,
          location3: location3 || undefined,
          capability_type: "JV_JD",
        });
        try {
          await submitBuilderJointVenture({
            company_name: companyName,
            years_experience: yearsExperience,
            entity_type: entityType || undefined,
            builder_license: builderLicense || undefined,
            rera_registration: reraRegistration || undefined,
            gst_number: gstNumber || undefined,
            address,
            project_caps: projectCaps,
            preferred_locations: preferredLocations || undefined,
            projects_completed: projectsCompleted || undefined,
            rera_yes_no: reraYesNo || undefined,
            rera_projects: reraYesNo === "yes" ? reraProjects : undefined,
            project_scale: projectScale || undefined,
            team_size: teamSize || undefined,
            jv_arrangements: jvArrangements,
            location1: location1 || undefined,
            radius1: radius1 || undefined,
            location2: location2 || undefined,
            radius2: radius2 || undefined,
            location3: location3 || undefined,
            radius3: radius3 || undefined,
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
      profileId: editProfileId || `builder-${Date.now()}-jv`,
      type: "joint-venture",
      companyName,
      yearsExperience,
      entityType,
      builderLicense: builderLicense || undefined,
      reraRegistration: reraRegistration || undefined,
      gstNumber: gstNumber || undefined,
      address,
      projectCaps,
      preferredLocations,
      projectsCompleted: projectsCompleted || undefined,
      reraYesNo,
      reraProjects: reraYesNo === "yes" ? reraProjects : undefined,
      projectScale,
      teamSize,
      jvArrangements,
      recentProjects: recentProjects.map((p) => ({
        nameLocation: p.nameLocation,
        builtUpSft: p.builtUpSft,
        type: p.type,
        durationMonths: p.durationMonths,
        imageCount: p.images.length,
        hasVideo: !!p.video,
      })),
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">JV / JD Development</h1>
              <div className="p-6 md:p-8 space-y-4">
                <p className="text-foreground leading-relaxed">
                  A Joint Venture (JV) / Joint Development (JD) is a structured development model where the landowner contributes the land, and the developer manages project capital, statutory approvals, design, and construction. Project returns are shared through a predefined structure typically revenue sharing or built-up area allocation as outlined in the development agreement. This model allows developers to execute projects without upfront land acquisition while leveraging their financial strength and execution capability.
                </p>
              </div>
              <Button size="lg" onClick={() => setStep("form")}>Continue to form</Button>
            </motion.div>
          )}

          {step === "form" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">JV / JD Developer</h1>

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
                {activeSectionId === "basic" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Name of your construction company or sole proprietorship</Label>
                    <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company name" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Number of years in operation or individual work experience</Label>
                    <Input value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} placeholder="Years" />
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
                </div>
                )}

                {activeSectionId === "licenses" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Builder / Contractor License (KPWD or equivalent)</Label>
                    <Input value={builderLicense} onChange={(e) => setBuilderLicense(e.target.value)} placeholder="License details" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">RERA registration (if applicable)</Label>
                    <Input value={reraRegistration} onChange={(e) => setReraRegistration(e.target.value)} placeholder="RERA registration" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">GST registration number (if applicable)</Label>
                    <Input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="GST number" />
                  </div>
                </div>
                )}

                {activeSectionId === "office" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Registered office or physical address in Bangalore</Label>
                    <CityAreaInput value={address} onChange={setAddress} placeholder="Select area (e.g. HSR Layout, Whitefield)" />
                  </div>
                  <BangaloreMap className="mt-4" height={320} area={address} />
                </div>
                )}

                {activeSectionId === "capabilities" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Types of projects you work on (Select all that apply):</Label>
                    <div className="space-y-2">
                      {PROJECT_CAPS.map((t) => (
                        <div key={t} className="flex items-center space-x-2">
                          <Checkbox id={`cap-${t}`} checked={projectCaps.includes(t)} onCheckedChange={() => toggleProjectCap(t)} />
                          <Label htmlFor={`cap-${t}`} className="font-normal cursor-pointer text-sm">{t}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Preferred project locations</Label>
                    <Textarea value={preferredLocations} onChange={(e) => setPreferredLocations(e.target.value)} placeholder="Areas where you prefer to take up projects" rows={2} />
                  </div>
                </div>
                )}

                {activeSectionId === "experience" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Total number of projects completed</Label>
                    <Input value={projectsCompleted} onChange={(e) => setProjectsCompleted(e.target.value)} placeholder="Number" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Have you commenced any RERA-registered projects?</Label>
                    <RadioGroup value={reraYesNo} onValueChange={(v) => setReraYesNo(v as "yes" | "no")} className="space-y-2 flex flex-row gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="rera-yes" />
                        <Label htmlFor="rera-yes" className="font-normal cursor-pointer">Yes (How many?)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="rera-no" />
                        <Label htmlFor="rera-no" className="font-normal cursor-pointer">No</Label>
                      </div>
                    </RadioGroup>
                    {reraYesNo === "yes" && (
                      <Input className="mt-2 w-32" placeholder="How many?" value={reraProjects} onChange={(e) => setReraProjects(e.target.value)} />
                    )}
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Kindly provide details for up to 3 most recent completed projects:</Label>
                    <p className="text-sm text-muted-foreground mb-4">For each project: Name / Location, Built-up Area (sft), Type of Building, Duration (months), 3 images + 1 video. You can upload or take a live photo from camera.</p>
                    {recentProjects.map((proj, idx) => (
                      <div key={idx} className="border border-border rounded-lg p-4 mb-4 space-y-3">
                        <p className="text-sm font-medium text-foreground">Project {idx + 1}</p>
                        <CityAreaInput placeholder="Area (e.g. HSR Layout, Koramangala)" value={proj.nameLocation} onChange={(v) => updateRecentProject(idx, "nameLocation", v)} />
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm text-muted-foreground mb-1 block">Built-up Area (sft)</Label>
                            <Input placeholder="Built-up Area (sft)" value={proj.builtUpSft} onChange={(e) => updateRecentProject(idx, "builtUpSft", e.target.value)} />
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground mb-1 block">Type of Building</Label>
                            <Select value={proj.type} onValueChange={(v) => updateRecentProject(idx, "type", v)}>
                              <SelectTrigger><SelectValue placeholder="Type of Building" /></SelectTrigger>
                              <SelectContent>
                                {PROJECT_TYPE_OPTIONS.map((o) => (
                                  <SelectItem key={o} value={o}>{o}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Input placeholder="Duration (months)" value={proj.durationMonths} onChange={(e) => updateRecentProject(idx, "durationMonths", e.target.value)} />
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

                {activeSectionId === "scale" && (
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">To help us understand your project experience, could you kindly indicate the typical size of projects you handle?</p>
                  <Select value={projectScale} onValueChange={setProjectScale}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {PROJECT_SCALE_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                )}

                {activeSectionId === "location" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Which locations are you comfortable undertaking a JV/JD project in? (Location + Radius in km, multiple entries allowed)</Label>
                    <div className="space-y-3">
                      <div className="flex gap-2 flex-wrap items-center">
                        <CityAreaInput placeholder="Location 1" value={location1} onChange={setLocation1} className="flex-1 min-w-[120px]" />
                        <Input type="number" placeholder="Radius (km)" value={radius1} onChange={(e) => setRadius1(e.target.value)} className="w-24" />
                      </div>
                      <div className="flex gap-2 flex-wrap items-center">
                        <CityAreaInput placeholder="Location 2" value={location2} onChange={setLocation2} className="flex-1 min-w-[120px]" />
                        <Input type="number" placeholder="Radius (km)" value={radius2} onChange={(e) => setRadius2(e.target.value)} className="w-24" />
                      </div>
                      <div className="flex gap-2 flex-wrap items-center">
                        <CityAreaInput placeholder="Location 3" value={location3} onChange={setLocation3} className="flex-1 min-w-[120px]" />
                        <Input type="number" placeholder="Radius (km)" value={radius3} onChange={(e) => setRadius3(e.target.value)} className="w-24" />
                      </div>
                    </div>
                  </div>
                </div>
                )}

                {activeSectionId === "team" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">What size of team do you typically deploy?</Label>
                    <Select value={teamSize} onValueChange={setTeamSize}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {TEAM_SIZE_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                )}

                {activeSectionId === "arrangement" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Which type of arrangement do you usually follow? (Select all that apply)</Label>
                    <div className="space-y-2">
                      {JV_ARRANGEMENT_OPTIONS.map((j) => (
                        <div key={j} className="flex items-center space-x-2">
                          <Checkbox id={`jv-${j}`} checked={jvArrangements.includes(j)} onCheckedChange={() => toggleJv(j)} />
                          <Label htmlFor={`jv-${j}`} className="font-normal cursor-pointer text-sm">{j}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
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

export default BuilderJointVenture;
