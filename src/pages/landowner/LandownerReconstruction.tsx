import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Home, MapPin, ListChecks, Calendar } from "lucide-react";
import { getAccessToken, createPropertyAndProjectFromLandownerForm, submitLandownerReconstructionForm } from "@/lib/api";
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
import { CONSTRUCTION_MODE_OPTIONS } from "@/lib/constructionModeOptions";

const PROPERTY_TYPES = {
  residential: ["Duplex house", "Villa", "Flat", "Other (Free text)"],
  commercial: ["Rental", "Hotel", "Office space", "Other (Free text)"],
  industrial: ["Warehouse", "Factory", "Other (Free text)"],
};

const SCOPE_OPTIONS = [
  "Repair work",
  "Add a new floor",
  "Repaint",
  "Redo flooring",
  "Other (Free text)",
];

const COMMENCE_OPTIONS = [
  "Immediately",
  "Within a month",
  "Within 3 months",
  "Within 6 months",
  "Just for research purpose",
];

const SECTIONS: StepFormSection[] = [
  { id: "property", label: "Property Details", icon: Home },
  { id: "location", label: "Locality / Location", icon: MapPin },
  { id: "scope", label: "Scope of Work", icon: ListChecks },
  { id: "timeline", label: "Timeline", icon: Calendar },
];

const LandownerReconstruction = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"brief" | "form" | "done">("brief");
  const [activeSectionId, setActiveSectionId] = useState(SECTIONS[0].id);

  const [propertyCategory, setPropertyCategory] = useState<"residential" | "commercial" | "industrial" | "other">("residential");
  const [propertyType, setPropertyType] = useState("");
  const [otherProperty, setOtherProperty] = useState("");
  const [location, setLocation] = useState("");
  const [streetName, setStreetName] = useState("");
  const [societyName, setSocietyName] = useState("");
  const [scope, setScope] = useState<string[]>([]);
  const [scopeOther, setScopeOther] = useState("");
  const [commence, setCommence] = useState("");
  const [constructionMode, setConstructionMode] = useState("");

  const toggleScope = (s: string) => {
    setScope((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const propType = propertyType === "Other (Free text)" || propertyCategory === "other" ? otherProperty : propertyType;
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
        type: propType || undefined,
      },
    };
    const formPayload = {
      property_type: { category: propertyCategory, type: propType },
      location: { address: location, googleMapsLocation: location, streetName: streetName.trim() || undefined, societyName: societyName.trim() || undefined },
      scope_of_work: { selected: scope, other: scope.includes("Other (Free text)") ? scopeOther : "" },
      timeline: commence,
      contract_preferences: constructionMode.trim()
        ? { construction_mode: constructionMode.trim() }
        : undefined,
    };

    const token = getAccessToken();
    if (token) {
      setSubmitting(true);
      setSubmitError(null);
      try {
        await createPropertyAndProjectFromLandownerForm(payload, "RECONSTRUCTION", { publish: true });
        try {
          await submitLandownerReconstructionForm(formPayload);
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
      type: "reconstruction",
      propertyType: { category: propertyCategory, type: propType },
      location: { address: location, googleMapsLocation: location, streetName: streetName.trim() || undefined, societyName: societyName.trim() || undefined },
      scopeOfWork: { selected: scope, other: scope.includes("Other (Free text)") ? scopeOther : "" },
      timeline: commence,
      contractPreferences: formPayload.contract_preferences,
      submittedAt: new Date().toISOString(),
    };
    const existingProjects = JSON.parse(localStorage.getItem("landownerProjects") || "[]");
    existingProjects.push(formData);
    localStorage.setItem("landownerProjects", JSON.stringify(existingProjects));
    setStep("done");
  };

  const canSubmit =
    !submitting &&
    propertyCategory &&
    (propertyCategory === "other" ? !!otherProperty.trim() : !!propertyType) &&
    !(propertyType === "Other (Free text)" && !otherProperty.trim()) &&
    !!constructionMode.trim() &&
    !!location.trim() &&
    scope.length > 0 &&
    !!commence &&
    !(scope.includes("Other (Free text)") && !scopeOther.trim());

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
                Renovation/Repaint
              </h1>
              <div className="group rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-6 md:p-8 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg space-y-4">
                <p className="text-foreground leading-relaxed">
                  Renovation/Repaint includes repairs, extensions, repainting, flooring
                  upgrades, or adding new floors to existing structures.
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
                Renovation/Repaint work
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
                        What type of property do you want to reconstruct? *
                      </Label>
                      <div className="space-y-3">
                        <Select
                          value={propertyCategory}
                          onValueChange={(v) => {
                            setPropertyCategory(v as "residential" | "commercial" | "industrial" | "other");
                            setPropertyType("");
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="residential">Residential</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                            <SelectItem value="industrial">Industrial</SelectItem>
                            <SelectItem value="other">Any others (Free text)</SelectItem>
                          </SelectContent>
                        </Select>
                        {propertyCategory === "residential" && (
                          <Select value={propertyType} onValueChange={setPropertyType}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {PROPERTY_TYPES.residential.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {propertyCategory === "commercial" && (
                          <Select value={propertyType} onValueChange={setPropertyType}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {PROPERTY_TYPES.commercial.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {propertyCategory === "industrial" && (
                          <Select value={propertyType} onValueChange={setPropertyType}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {PROPERTY_TYPES.industrial.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {(propertyType === "Other (Free text)" || propertyCategory === "other") && (
                          <Input
                            placeholder="Specify (Free text)"
                            value={otherProperty}
                            onChange={(e) => setOtherProperty(e.target.value)}
                          />
                        )}
                      </div>
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
                        What is the scope of the work? *
                      </Label>
                      <div className="space-y-2">
                        {SCOPE_OPTIONS.filter((s) => s !== "Other (Free text)").map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <Checkbox
                              id={`scope-${option}`}
                              checked={scope.includes(option)}
                              onCheckedChange={() => toggleScope(option)}
                            />
                            <Label htmlFor={`scope-${option}`} className="font-normal cursor-pointer">{option}</Label>
                          </div>
                        ))}
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="scope-other"
                            checked={scope.includes("Other (Free text)")}
                            onCheckedChange={() => toggleScope("Other (Free text)")}
                          />
                          <Label htmlFor="scope-other" className="font-normal cursor-pointer">Other (Free text)</Label>
                        </div>
                        {scope.includes("Other (Free text)") && (
                          <Input
                            placeholder="Specify (Free text)"
                            value={scopeOther}
                            onChange={(e) => setScopeOther(e.target.value)}
                            className="mt-2 ml-6"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeSectionId === "timeline" && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold mb-2 block">
                        Preferred construction / contracting model *
                      </Label>
                      <Select value={constructionMode} onValueChange={setConstructionMode}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select how you want to run the renovation work" />
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
                    <p className="text-foreground font-medium">Your renovation/repaint project has been published</p>
                    <p className="text-sm text-muted-foreground">Renovation/Repaint project published on Opportunities</p>
                  </div>
                </div>
                <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                  <p className="text-sm font-medium text-primary mb-2">What happens next:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                    <li>Renovation/Repaint project published on Opportunities</li>
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

export default LandownerReconstruction;
