import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Home, MapPin, ListChecks, Calendar, User } from "lucide-react";
import { getAccessToken, createPropertyAndProjectFromLandownerForm, submitLandownerInteriorForm } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { CONSTRUCTION_MODE_OPTIONS } from "@/lib/constructionModeOptions";

const BUILDING_TYPES = [
  "Duplex house",
  "Flat",
  "Office space",
  "Commercial building",
  "New ongoing project",
  "Other (Free text)",
];

const COMMENCE_OPTIONS = [
  "Immediately",
  "Within a month",
  "Within 3 months",
  "Within 6 months",
  "Just here for research",
];

const SPACE_TYPE_OPTIONS = [
  "Full home / entire unit",
  "Living & dining only",
  "Kitchen",
  "Bedrooms only",
  "Office / commercial unit",
  "Retail / showroom",
  "Other (describe in scope)",
];

const DESIGN_STYLE_OPTIONS = [
  "Modern / contemporary",
  "Traditional / classic",
  "Minimal",
  "Industrial",
  "Scandinavian",
  "Bohemian / eclectic",
  "Not sure — open to ideas",
  "Other (describe in scope)",
];

const SECTIONS: StepFormSection[] = [
  { id: "property", label: "Property Details", icon: Home },
  { id: "location", label: "Locality / Location", icon: MapPin },
  { id: "scope", label: "Scope of Work", icon: ListChecks },
  { id: "poc", label: "Point of contact", icon: User },
  { id: "timeline", label: "Timeline", icon: Calendar },
];

const LandownerInterior = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"brief" | "form" | "done">("brief");
  const [activeSectionId, setActiveSectionId] = useState(SECTIONS[0].id);

  const [buildingType, setBuildingType] = useState("");
  const [buildingTypeOther, setBuildingTypeOther] = useState("");
  const [constructionMode, setConstructionMode] = useState("");
  const [location, setLocation] = useState("");
  const [streetName, setStreetName] = useState("");
  const [societyName, setSocietyName] = useState("");
  const [isEndToEnd, setIsEndToEnd] = useState<"yes" | "no" | "">("");
  const [scopeExplain, setScopeExplain] = useState("");
  const [spaceType, setSpaceType] = useState("");
  const [designStyle, setDesignStyle] = useState("");
  const [hasPoc, setHasPoc] = useState<"yes" | "no" | "">("");
  const [pocName, setPocName] = useState("");
  const [pocMobile, setPocMobile] = useState("");
  const [pocAvailability, setPocAvailability] = useState("");
  const [pocTiming, setPocTiming] = useState("");
  const [commence, setCommence] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const buildingTypeVal = buildingType === "Other (Free text)" ? buildingTypeOther : buildingType;
    const payload = {
      property_location: {
        city: "Bangalore",
        landmark: location || undefined,
        google_maps_location: location || undefined,
        street_name: streetName.trim() || undefined,
        society_name: societyName.trim() || undefined,
      },
      property_details: {},
      project_intent: {
        timeline: commence || undefined,
        type: buildingTypeVal || undefined,
      },
    };
    const pointOfContact =
      hasPoc === "yes"
        ? {
            has_poc: true as const,
            name: pocName.trim() || undefined,
            mobile: pocMobile.trim() || undefined,
            availability: pocAvailability.trim() || undefined,
            timing: pocTiming.trim() || undefined,
          }
        : hasPoc === "no"
          ? { has_poc: false as const }
          : undefined;

    const formPayload = {
      property_location: payload.property_location,
      property_details: payload.property_details,
      project_scope: { isEndToEnd: isEndToEnd === "yes", scopeExplain: isEndToEnd === "no" ? scopeExplain : "" },
      timeline: commence,
      building_type: buildingTypeVal,
      location: { address: location, googleMapsLocation: location, streetName: streetName.trim() || undefined, societyName: societyName.trim() || undefined },
      interior_preferences:
        spaceType || designStyle
          ? { space_type: spaceType || undefined, design_style: designStyle || undefined }
          : undefined,
      ...(pointOfContact !== undefined ? { point_of_contact: pointOfContact } : {}),
      contract_preferences: constructionMode.trim()
        ? { construction_mode: constructionMode.trim() }
        : undefined,
    };

    const token = getAccessToken();
    if (token) {
      setSubmitting(true);
      setSubmitError(null);
      try {
        await createPropertyAndProjectFromLandownerForm(payload, "INTERIOR", { publish: true });
        try {
          await submitLandownerInteriorForm(formPayload);
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
      type: "interior",
      buildingType: buildingTypeVal,
      location: { address: location, googleMapsLocation: location, streetName: streetName.trim() || undefined, societyName: societyName.trim() || undefined },
      projectScope: { isEndToEnd: isEndToEnd === "yes", scopeExplain: isEndToEnd === "no" ? scopeExplain : "" },
      timeline: commence,
      interiorPreferences: { spaceType, designStyle },
      contractPreferences: formPayload.contract_preferences,
      pointOfContact,
      submittedAt: new Date().toISOString(),
    };
    const existingProjects = JSON.parse(localStorage.getItem("landownerProjects") || "[]");
    existingProjects.push(formData);
    localStorage.setItem("landownerProjects", JSON.stringify(existingProjects));
    setStep("done");
  };

  const canSubmit =
    !submitting &&
    !!buildingType &&
    !!constructionMode.trim() &&
    !!location.trim() &&
    !!isEndToEnd &&
    !!spaceType &&
    !!designStyle &&
    !!hasPoc &&
    !!commence &&
    !(buildingType === "Other (Free text)" && !buildingTypeOther.trim()) &&
    !(isEndToEnd === "no" && !scopeExplain.trim()) &&
    !(
      hasPoc === "yes" &&
      (!pocName.trim() || !pocMobile.trim() || !pocAvailability.trim())
    );

  return (
    <div className="w-full overflow-x-hidden">
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-background" />
        <div className="relative z-10 max-w-5xl mx-auto w-full">
          <Link
            to="/landowner/options"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
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
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Interior Architecture / Designer
              </h1>
              <div className="group rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-6 md:p-8 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg space-y-4">
                <p className="text-foreground leading-relaxed">
                  Interior architecture and design focus on planning, designing, and enhancing interior spaces to improve functionality, aesthetics, and comfort covering layout planning, materials, finishes, and execution coordination.
                </p>
              </div>
              <Button size="lg" onClick={() => setStep("form")} className="w-full sm:w-auto">
                Continue
              </Button>
            </motion.div>
          )}

          {step === "form" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Interior Architect / Designer
              </h1>

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
                submitDisabled={!canSubmit}
                isSubmitting={submitting}
              >
                {activeSectionId === "property" && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold mb-2 block">
                        What type of building are you looking to build or do interiors for? *
                      </Label>
                      <Select value={buildingType} onValueChange={setBuildingType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUILDING_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {buildingType === "Other (Free text)" && (
                        <Input
                          placeholder="Specify (Free text)"
                          value={buildingTypeOther}
                          onChange={(e) => setBuildingTypeOther(e.target.value)}
                          className="mt-3"
                        />
                      )}
                    </div>
                    <div>
                      <Label className="text-base font-semibold mb-2 block">Preferred construction / engagement model *</Label>
                      <Select value={constructionMode} onValueChange={setConstructionMode}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select how you want to work with a professional" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONSTRUCTION_MODE_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {activeSectionId === "location" && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold mb-2 block">
                        Where is the property located? *
                      </Label>
                      <CityAreaInput
                        placeholder="Select area (e.g. HSR Layout, Koramangala, Whitefield)"
                        value={location}
                        onChange={setLocation}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-base font-semibold mb-2 block">Street name</Label>
                      <Input placeholder="Street name" value={streetName} onChange={(e) => setStreetName(e.target.value)} className="w-full" />
                    </div>
                    <div>
                      <Label className="text-base font-semibold mb-2 block">Society name</Label>
                      <Input placeholder="Society / apartment name" value={societyName} onChange={(e) => setSocietyName(e.target.value)} className="w-full" />
                    </div>
                    <BangaloreMap className="mt-4" height={320} area={location} />
                  </div>
                )}

                {activeSectionId === "scope" && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold mb-2 block">
                        Is it a complete new &quot;end-to-end&quot; project? *
                      </Label>
                      <RadioGroup value={isEndToEnd} onValueChange={(v) => setIsEndToEnd(v as "yes" | "no")} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="e2e-yes" />
                          <Label htmlFor="e2e-yes" className="font-normal cursor-pointer">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="e2e-no" />
                          <Label htmlFor="e2e-no" className="font-normal cursor-pointer">No → Explain scope of work (Free text)</Label>
                        </div>
                      </RadioGroup>
                      {isEndToEnd === "no" && (
                        <Textarea
                          placeholder="Explain scope of work (Free text)"
                          value={scopeExplain}
                          onChange={(e) => setScopeExplain(e.target.value)}
                          rows={4}
                          className="mt-3"
                        />
                      )}
                    </div>
                    <div>
                      <Label className="text-base font-semibold mb-2 block">Which space are you focusing on? *</Label>
                      <Select value={spaceType} onValueChange={setSpaceType}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select space type" />
                        </SelectTrigger>
                        <SelectContent>
                          {SPACE_TYPE_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-base font-semibold mb-2 block">Preferred design style *</Label>
                      <Select value={designStyle} onValueChange={setDesignStyle}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent>
                          {DESIGN_STYLE_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {activeSectionId === "poc" && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold mb-2 block">
                        Is there a point of contact (POC) for site visits? *
                      </Label>
                      <RadioGroup
                        value={hasPoc}
                        onValueChange={(v) => setHasPoc(v as "yes" | "no")}
                        className="flex flex-wrap gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="int-poc-yes" />
                          <Label htmlFor="int-poc-yes" className="font-normal cursor-pointer">
                            Yes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="int-poc-no" />
                          <Label htmlFor="int-poc-no" className="font-normal cursor-pointer">
                            No
                          </Label>
                        </div>
                      </RadioGroup>
                      {hasPoc === "yes" && (
                        <div className="mt-4 space-y-3 pl-2 border-l-2 border-primary/20">
                          <div>
                            <Label className="text-sm font-medium mb-1 block">Name of the contact person</Label>
                            <Input
                              placeholder="Full name"
                              value={pocName}
                              onChange={(e) => setPocName(e.target.value)}
                              className="max-w-md"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-1 block">Mobile number</Label>
                            <Input
                              type="tel"
                              placeholder="10-digit mobile number"
                              value={pocMobile}
                              onChange={(e) => setPocMobile(e.target.value)}
                              className="max-w-md"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-1 block">When can the POC show the site? (availability)</Label>
                            <Input
                              placeholder="e.g. Weekdays, Weekends, Any day"
                              value={pocAvailability}
                              onChange={(e) => setPocAvailability(e.target.value)}
                              className="max-w-md"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-1 block">Preferred time slot</Label>
                            <Input
                              placeholder="e.g. Morning 9am–12pm"
                              value={pocTiming}
                              onChange={(e) => setPocTiming(e.target.value)}
                              className="max-w-md"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeSectionId === "timeline" && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold mb-2 block">
                        When do you want to commence the work? *
                      </Label>
                      <Select value={commence} onValueChange={setCommence}>
                        <SelectTrigger className="max-w-sm">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMMENCE_OPTIONS.map((o) => (
                            <SelectItem key={o} value={o}>{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Project Published!</h1>
              <div className="glass-card rounded-2xl p-6 md:p-8 border border-glass-border space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-foreground font-medium">Your interior project has been published</p>
                    <p className="text-sm text-muted-foreground">Interior project published on Opportunities</p>
                  </div>
                </div>
                <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                  <p className="text-sm font-medium text-primary mb-2">What happens next:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                    <li>Interior project published on Opportunities</li>
                    <li>Connected with relevant professionals based on scope and property type</li>
                    <li>You'll be notified when professionals respond</li>
                  </ul>
                </div>
              </div>
              <Button size="lg" onClick={() => navigate("/landowner/dashboard")} className="w-full sm:w-auto">
                Go to Dashboard
              </Button>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default LandownerInterior;
