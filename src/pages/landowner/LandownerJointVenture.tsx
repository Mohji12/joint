import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, AlertCircle, Home, BarChart3, Shield, Handshake, Lightbulb, Phone } from "lucide-react";
import {
  getAccessToken,
  submitLandownerJointVenture,
  createPropertyAndProjectFromLandownerForm,
  calculateFar,
  generatePlanImage,
  type FARResult,
  type FARUseType,
  type FARZone,
  FAR_ZONE_OPTIONS,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CityAreaInput } from "@/components/CityAreaInput";
import { BangaloreMap } from "@/components/BangaloreMap";
import { StepFormLayout, type StepFormSection } from "@/components/StepFormLayout";
import { CONSTRUCTION_MODE_OPTIONS } from "@/lib/constructionModeOptions";

const PROPERTY_DIMENSIONS = [
  "30x40",
  "20x30",
  "30x50",
  "20x40",
  "40x60",
  "50x60",
  "50x80",
  "Others (Free text)",
];

const POST_CONSTRUCTION_OPTIONS = [
  "Square foot sharing",
  "Revenue sharing",
];

const JV_TIMELINE_OPTIONS = [
  "Immediately",
  "Within a month",
  "Within 3 months",
  "Within 6 months",
  "Just here for research",
];

const SECTIONS: StepFormSection[] = [
  { id: "property", label: "Property Details", icon: Home },
  { id: "far", label: "FAR & Development Potential", icon: BarChart3 },
  { id: "verification", label: "Property Verification", icon: Shield },
  { id: "expectation", label: "Post-Construction Expectation", icon: Handshake },
  { id: "planning", label: "Planning Intention", icon: Lightbulb },
  { id: "poc", label: "Point of Contact", icon: Phone },
];

const LandownerJointVenture = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"brief" | "form" | "done">("brief");
  const [activeSectionId, setActiveSectionId] = useState(SECTIONS[0].id);

  const [propertyDimensions, setPropertyDimensions] = useState("");
  const [propertyDimensionsOther, setPropertyDimensionsOther] = useState("");
  const [locality, setLocality] = useState("");
  const [ward, setWard] = useState("");
  const [landmark, setLandmark] = useState("");
  const [streetName, setStreetName] = useState("");
  const [societyName, setSocietyName] = useState("");
  const [propertyFacing, setPropertyFacing] = useState("");
  const [hasPoc, setHasPoc] = useState<"yes" | "no" | "">("");
  const [pocName, setPocName] = useState("");
  const [pocMobile, setPocMobile] = useState("");
  const [pocAvailability, setPocAvailability] = useState("");
  const [pocTiming, setPocTiming] = useState("");
  const [googleMapsLocation, setGoogleMapsLocation] = useState("");
  const [isCornerProperty, setIsCornerProperty] = useState(false);
  const [cornerFacings, setCornerFacings] = useState("");
  const [roadWidth, setRoadWidth] = useState("");

  const [propertyOwnerName, setPropertyOwnerName] = useState("");
  const [pidNumber, setPidNumber] = useState("");
  const [khathaType, setKhathaType] = useState("");
  const [ekhathaStatus, setEkhathaStatus] = useState("");
  const [taxPaidDetails, setTaxPaidDetails] = useState("");

  const [postConstructionExpectation, setPostConstructionExpectation] = useState<string[]>([]);
  const [hasPresetIdea, setHasPresetIdea] = useState<"yes" | "no" | "">("");
  const [presetIdeaExplain, setPresetIdeaExplain] = useState("");
  const [timeline, setTimeline] = useState("");
  const [constructionMode, setConstructionMode] = useState("");


  const [zone, setZone] = useState<FARZone | undefined>(undefined);
  const [farResult, setFarResult] = useState<FARResult | null>(null);
  const [farError, setFarError] = useState<string | null>(null);
  const [farLoading, setFarLoading] = useState(false);
  const [planImageUrl, setPlanImageUrl] = useState<string | null>(null);
  const [planImageLoading, setPlanImageLoading] = useState(false);
  const [planImageError, setPlanImageError] = useState<string | null>(null);

  const togglePostConstruction = (option: string) => {
    setPostConstructionExpectation((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };

  const parseDimensions = () => {
    const dimStr = propertyDimensions === "Others (Free text)" ? propertyDimensionsOther : propertyDimensions;
    if (!dimStr) return { length: undefined as number | undefined, width: undefined as number | undefined };
    const parts = dimStr.split(/[x×]/i).map((d) => parseFloat(d.trim()));
    if (parts.length !== 2 || parts.some((v) => Number.isNaN(v))) {
      return { length: undefined as number | undefined, width: undefined as number | undefined };
    }
    return { length: parts[0], width: parts[1] };
  };

  const plotAreaSqft = (() => {
    const { length, width } = parseDimensions();
    if (length == null || width == null) return null;
    return Math.round(length * width);
  })();

  const getUseTypeForFar = (): FARUseType => {
    // JV/JD is usually residential; can be adjusted in future if you collect more detail.
    return "RESIDENTIAL";
  };

  const ensureFarCalculated = async (): Promise<FARResult | null> => {
    setFarError(null);
    const roadWidthNum = parseFloat(roadWidth) || 0;
    const { length, width } = parseDimensions();
    if (!length || !width || !roadWidthNum) {
      setFarError("Enter valid dimensions and road width to calculate FAR.");
      return null;
    }
    try {
      setFarLoading(true);
      const result = await calculateFar({
        plot_length_ft: length,
        plot_width_ft: width,
        road_width_ft: roadWidthNum,
        zone,
        use_type: getUseTypeForFar(),
      });
      setFarResult(result);
      return result;
    } catch (e) {
      setFarError(e instanceof Error ? e.message : "FAR calculation failed. Please try again.");
      return null;
    } finally {
      setFarLoading(false);
    }
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const farCalc = await ensureFarCalculated();
    const feasibility = farCalc
      ? {
          plotArea: farCalc.plot_area_sqft,
          far: farCalc.effective_far,
          totalBuildableArea: farCalc.total_buildable_area_sqft,
          netBuildableArea: farCalc.total_buildable_area_sqft * 0.75,
          setbacks: farCalc.setbacks,
          allowedFloors: farCalc.floors_allowed,
        }
      : {};
    const payload = {
      property_location: {
        city: "Bangalore",
        locality: locality || undefined,
        ward,
        landmark,
        street_name: streetName.trim() || undefined,
        society_name: societyName.trim() || undefined,
        google_maps_location: googleMapsLocation,
      },
      project_intent: {
        timeline: timeline || undefined,
      },
      point_of_contact: hasPoc === "yes"
        ? {
            has_poc: true,
            name: pocName.trim() || undefined,
            mobile: pocMobile.trim() || undefined,
            availability: pocAvailability.trim() || undefined,
            timing: pocTiming.trim() || undefined,
          }
        : { has_poc: false },
      property_details: {
        dimensions: propertyDimensions === "Others (Free text)" ? propertyDimensionsOther : propertyDimensions,
        facing: propertyFacing,
        is_corner_property: isCornerProperty,
        corner_facings: isCornerProperty ? cornerFacings : "",
        road_width: roadWidth,
      },
      verification: {
        property_owner_name: propertyOwnerName,
        pid_number: pidNumber,
        khatha_type: khathaType,
        ekhatha_status: ekhathaStatus,
        tax_paid_details: taxPaidDetails,
      },
      jv_preferences: {
        post_construction_expectation: postConstructionExpectation,
        has_preset_idea: hasPresetIdea,
        preset_idea_explain: hasPresetIdea === "yes" ? presetIdeaExplain : "",
      },
      contract_preferences: constructionMode.trim()
        ? { construction_mode: constructionMode.trim() }
        : undefined,
      feasibility,
    };

    const token = getAccessToken();
    if (token) {
      setSubmitting(true);
      setSubmitError(null);
      try {
        await createPropertyAndProjectFromLandownerForm(
          { ...payload, verification: payload.verification },
          "JV_JD",
          { publish: true }
        );
        try {
          await submitLandownerJointVenture(payload);
        } catch {
          // Form audit is best-effort; entity already created
        }
        setStep("done");
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "Submit failed");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const pl = payload.property_location || {};
    const pd = payload.property_details || {};
    const ver = payload.verification || {};
    const jv = payload.jv_preferences || {};
    const feas = payload.feasibility || {};
    const pi = payload.project_intent || {};
    const formData = {
      type: "joint-venture",
      propertyLocation: {
        city: pl.city,
        locality: pl.locality,
        ward: pl.ward,
        landmark: pl.landmark,
        address: pl.google_maps_location || googleMapsLocation,
        googleMapsLocation: pl.google_maps_location || googleMapsLocation,
        streetName: pl.street_name,
        societyName: pl.society_name,
      },
      pointOfContact: payload.point_of_contact,
      propertyDetails: {
        dimensions: pd.dimensions,
        facing: pd.facing,
        roadWidth: pd.road_width,
        isCornerProperty: pd.is_corner_property,
        cornerFacings: pd.corner_facings,
      },
      verification: { khathaType: ver.khatha_type, ekhathaStatus: ver.ekhatha_status },
      jvPreferences: {
        postConstructionExpectation: jv.post_construction_expectation || [],
        presetIdeaExplain: jv.preset_idea_explain,
      },
      projectIntent: { timeline: pi.timeline },
      timeline: pi.timeline,
      feasibility: {
        far: feas.far != null ? String(feas.far) : farCalc ? String(farCalc.effective_far) : undefined,
        allowedFloors: feas.allowedFloors || farCalc?.floors_allowed,
        totalBuildableArea: farCalc?.total_buildable_area_sqft,
      },
      contractPreferences: payload.contract_preferences,
      submittedAt: new Date().toISOString(),
    };
    const existingProjects = JSON.parse(localStorage.getItem("landownerProjects") || "[]");
    existingProjects.push(formData);
    localStorage.setItem("landownerProjects", JSON.stringify(existingProjects));
    setStep("done");
  };

  return (
    <div className="w-full overflow-x-hidden">
      <section className="relative py-6 sm:py-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 via-background to-background" />
        <div className="relative z-10 max-w-3xl mx-auto w-full">
          <Link
            to="/landowner/options"
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
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Joint Venture / Joint Development (JV/JD)</h1>
              <div className="group rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-6 md:p-8 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg space-y-6">
                <p className="text-foreground leading-relaxed">
                  A JV/JD is a structured partnership where a landowner and a developer collaborate to develop a property 
                  and share risks and returns under a formal agreement.
                </p>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Key Features:</h3>
                  <ul className="space-y-1 text-sm text-foreground list-disc list-inside">
                    <li>Landowner contributes the land</li>
                    <li>Developer bears project costs and execution risk</li>
                    <li>Developer manages design, approvals, and construction</li>
                    <li>Returns are shared through revenue share or built-up area allocation</li>
                    <li>Legal, architectural, and feasibility terms are defined upfront</li>
                    <li>Ideal for landowners seeking development without upfront capital</li>
                  </ul>
                </div>
                <div className="rounded-lg p-4 border border-border">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">Important</p>
                      <p className="text-xs text-foreground">
                        FAR + PID validation is compulsory for JV/JD projects.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <Button size="lg" onClick={() => setStep("form")} className="w-full sm:w-auto">
                Start
              </Button>
            </motion.div>
          )}

          {step === "form" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Joint Venture / Joint Development (JV/JD)</h1>

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
                submitDisabled={
                  !propertyDimensions ||
                  (propertyDimensions === "Others (Free text)" && !propertyDimensionsOther.trim()) ||
                  !ward ||
                  !propertyFacing ||
                  !googleMapsLocation.trim() ||
                  !roadWidth ||
                  !propertyOwnerName.trim() ||
                  !pidNumber.trim() ||
                  !khathaType.trim() ||
                  !ekhathaStatus ||
                  !taxPaidDetails.trim() ||
                  postConstructionExpectation.length === 0 ||
                  !hasPresetIdea ||
                  (hasPresetIdea === "yes" && !presetIdeaExplain.trim()) ||
                  !constructionMode.trim() ||
                  submitting
                }
                isSubmitting={submitting}
              >
                {activeSectionId === "property" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Property dimension</Label>
                    <Select value={propertyDimensions} onValueChange={setPropertyDimensions}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {PROPERTY_DIMENSIONS.map((dim) => (
                          <SelectItem key={dim} value={dim}>{dim}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {propertyDimensions === "Others (Free text)" && (
                      <Input placeholder="Specify dimensions (e.g., 60x80)" value={propertyDimensionsOther} onChange={(e) => setPropertyDimensionsOther(e.target.value)} className="mt-2" />
                    )}
                    {plotAreaSqft != null && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Plot area: <span className="font-medium text-foreground">{plotAreaSqft.toLocaleString()} sq ft</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Which location and ward is the property located in?</Label>
                    <p className="text-sm text-muted-foreground mb-2">(Bangalore + Area + Landmark nearby)</p>
                    <div className="space-y-2">
                      <Input value="Bangalore" disabled className="w-full sm:max-w-xs" />
                      <CityAreaInput placeholder="Area / Locality (e.g. HSR Layout, Koramangala)" value={locality} onChange={setLocality} className="w-full" />
                      <Input placeholder="Ward number / name" value={ward} onChange={(e) => setWard(e.target.value)} />
                      <Input placeholder="Street name" value={streetName} onChange={(e) => setStreetName(e.target.value)} className="w-full" />
                      <Input placeholder="Society name" value={societyName} onChange={(e) => setSocietyName(e.target.value)} className="w-full" />
                      <Input placeholder="Landmark nearby" value={landmark} onChange={(e) => setLandmark(e.target.value)} />
                    </div>
                    <BangaloreMap className="mt-4" height={320} area={locality} facing={propertyFacing} />
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Facing of the property</Label>
                    <Select value={propertyFacing} onValueChange={setPropertyFacing}>
                      <SelectTrigger><SelectValue placeholder="Select facing" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="North">North</SelectItem>
                        <SelectItem value="South">South</SelectItem>
                        <SelectItem value="East">East</SelectItem>
                        <SelectItem value="West">West</SelectItem>
                        <SelectItem value="North-East">North-East</SelectItem>
                        <SelectItem value="North-West">North-West</SelectItem>
                        <SelectItem value="South-East">South-East</SelectItem>
                        <SelectItem value="South-West">South-West</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Google Map location and pin *</Label>
                    <Input placeholder="Paste Google Maps link or coordinates" value={googleMapsLocation} onChange={(e) => setGoogleMapsLocation(e.target.value)} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox id="corner-jv" checked={isCornerProperty} onCheckedChange={(c) => setIsCornerProperty(c as boolean)} />
                      <Label htmlFor="corner-jv" className="font-normal cursor-pointer">Is it a corner property?</Label>
                    </div>
                    {isCornerProperty && (
                      <Input placeholder="If Yes → Specify facing" value={cornerFacings} onChange={(e) => setCornerFacings(e.target.value)} className="mt-2" />
                    )}
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Road width in front of the property</Label>
                    <Input type="number" placeholder="Feet" value={roadWidth} onChange={(e) => setRoadWidth(e.target.value)} />
                  </div>
                </div>
                )}

                {activeSectionId === "far" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-base font-semibold mb-2 block">Zone (for FAR)</Label>
                      <Select value={zone} onValueChange={(v) => setZone(v as FARZone)}>
                        <SelectTrigger><SelectValue placeholder="Select zone" /></SelectTrigger>
                        <SelectContent>
                          {FAR_ZONE_OPTIONS.map((z) => (
                            <SelectItem key={z.value} value={z.value}>{z.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Premium FAR removed from JV/JD landowner form. */}
                  </div>
                  <div className="group rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-primary">FAR & Maximum Built-up Area (indicative)</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Fill plot dimensions, road width, and zone to get an instant estimate.
                    </p>
                    {farError && <p className="text-xs text-destructive">{farError}</p>}
                    {farLoading && <p className="text-xs text-muted-foreground">Calculating FAR…</p>}
                    {farResult && !farLoading && (
                      <>
                        <p className="text-xs text-muted-foreground">
                          Base FAR {farResult.base_far.toFixed(2)} ={" "}
                          <span className="font-medium text-foreground">
                            Effective FAR {farResult.effective_far.toFixed(2)}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Maximum Built-up Area ≈{" "}
                          <span className="font-medium text-foreground">
                            {Math.round(farResult.total_buildable_area_sqft).toLocaleString()} sq ft
                          </span>
                          {farResult.floors_allowed && ` · Typical height: ${farResult.floors_allowed}`}
                        </p>
                        {farResult.setbacks && (
                          <p className="text-[11px] text-muted-foreground">
                            Setbacks (indicative): Front {farResult.setbacks.front_setback_m} m,
                            Rear {farResult.setbacks.rear_setback_m} m,
                            Sides {farResult.setbacks.side_setback_m} m · Coverage ~
                            {farResult.setbacks.coverage_percent}%.
                          </p>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          disabled={planImageLoading}
                          onClick={async () => {
                            if (!farResult) return;
                            setPlanImageError(null);
                            setPlanImageUrl(null);
                            setPlanImageLoading(true);
                            try {
                              const res = await generatePlanImage({
                                plot_area_sqft: farResult.plot_area_sqft,
                                effective_far: farResult.effective_far,
                                total_buildable_area_sqft: farResult.total_buildable_area_sqft,
                                floors_allowed: farResult.floors_allowed,
                                use_type: farResult.use_type as FARUseType,
                                setbacks: farResult.setbacks
                                  ? {
                                      front_setback_m: farResult.setbacks.front_setback_m,
                                      rear_setback_m: farResult.setbacks.rear_setback_m,
                                      side_setback_m: farResult.setbacks.side_setback_m,
                                      coverage_percent: farResult.setbacks.coverage_percent,
                                    }
                                  : undefined,
                              });
                              setPlanImageUrl(res.image_url);
                            } catch (e) {
                              setPlanImageError(e instanceof Error ? e.message : "Failed to generate plan preview.");
                            } finally {
                              setPlanImageLoading(false);
                            }
                          }}
                        >
                          {planImageLoading ? "Generating…" : "Generate plan preview"}
                        </Button>
                      </>
                    )}
                    {planImageLoading && <p className="text-xs text-muted-foreground mt-2">Generating plan image…</p>}
                    {planImageError && <p className="text-xs text-destructive mt-2">{planImageError}</p>}
                    {planImageUrl && (
                      <div className="mt-3 space-y-1">
                        <img src={planImageUrl} alt="Indicative plan" className="w-full max-w-md rounded-lg border border-border" />
                        <p className="text-[11px] text-muted-foreground">Indicative 2D layout only; not a sanctioned plan.</p>
                      </div>
                    )}
                    {!farResult && !farLoading && (
                      <p className="text-xs text-muted-foreground">
                        FAR and total buildable area will be calculated based on plot size, road width, and zoning.
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      These are illustrative planning numbers based on 2024 2026 BBMP/BDA guidance, not a sanctioned plan.
                    </p>
                  </div>
                </div>
                )}

                {activeSectionId === "verification" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Name of the property owner</Label>
                    <Input placeholder="Your full name" value={propertyOwnerName} onChange={(e) => setPropertyOwnerName(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">PID Number (Mandatory)</Label>
                    <Input placeholder="Enter PID number" value={pidNumber} onChange={(e) => setPidNumber(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Which Khatha type is the land?</Label>
                    <Input placeholder="e.g., A-Khatha, B-Khatha" value={khathaType} onChange={(e) => setKhathaType(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Is it E-Khatha?</Label>
                    <Select value={ekhathaStatus} onValueChange={setEkhathaStatus}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="In Process">In Process</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Tax paid information</Label>
                    <Textarea placeholder="Details about tax payments" value={taxPaidDetails} onChange={(e) => setTaxPaidDetails(e.target.value)} rows={3} />
                  </div>
                </div>
                )}

                {activeSectionId === "expectation" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">What is the client (landowner) seeking post-construction?</Label>
                    <div className="space-y-2">
                      {POST_CONSTRUCTION_OPTIONS.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox id={`post-${option}`} checked={postConstructionExpectation.includes(option)} onCheckedChange={() => togglePostConstruction(option)} />
                          <Label htmlFor={`post-${option}`} className="font-normal cursor-pointer">{option}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                )}

                {activeSectionId === "planning" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Preferred construction model *</Label>
                    <Select value={constructionMode} onValueChange={setConstructionMode}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select how you want to work with a builder / partner" />
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
                    <Label className="text-base font-semibold mb-2 block">Do you have a preset idea of what to build?</Label>
                    <RadioGroup value={hasPresetIdea} onValueChange={(v) => setHasPresetIdea(v as "yes" | "no")} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="preset-yes" />
                        <Label htmlFor="preset-yes" className="font-normal cursor-pointer">Yes → Explain (Free text)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="preset-no" />
                        <Label htmlFor="preset-no" className="font-normal cursor-pointer">No → System suggests based on property data</Label>
                      </div>
                    </RadioGroup>
                    {hasPresetIdea === "yes" && (
                      <Textarea placeholder="Explain your idea" value={presetIdeaExplain} onChange={(e) => setPresetIdeaExplain(e.target.value)} rows={4} className="mt-3" />
                    )}
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Expected timeline / intent to start</Label>
                    <Select value={timeline} onValueChange={setTimeline}>
                      <SelectTrigger><SelectValue placeholder="Select timeline" /></SelectTrigger>
                      <SelectContent>
                        {JV_TIMELINE_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                )}

                {activeSectionId === "poc" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Is there any point of contact (POC) for this project?</Label>
                    <RadioGroup value={hasPoc} onValueChange={(v) => setHasPoc(v as "yes" | "no")} className="flex flex-wrap gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="jv-poc-yes" />
                        <Label htmlFor="jv-poc-yes" className="font-normal cursor-pointer">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="jv-poc-no" />
                        <Label htmlFor="jv-poc-no" className="font-normal cursor-pointer">No</Label>
                      </div>
                    </RadioGroup>
                    {hasPoc === "yes" && (
                      <div className="mt-4 space-y-3 pl-2 border-l-2 border-primary/20">
                        <div>
                          <Label className="text-sm font-medium mb-1 block">Name of the contact person</Label>
                          <Input placeholder="Full name" value={pocName} onChange={(e) => setPocName(e.target.value)} className="max-w-md" />
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-1 block">Mobile number</Label>
                          <Input type="tel" placeholder="10-digit mobile number" value={pocMobile} onChange={(e) => setPocMobile(e.target.value)} className="max-w-md" />
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-1 block">When can the POC show the property? (availability)</Label>
                          <Input
                            placeholder="e.g. Weekdays, Weekends, Any day"
                            value={pocAvailability}
                            onChange={(e) => setPocAvailability(e.target.value)}
                            className="max-w-md"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-1 block">Preferred time slot for site visit</Label>
                          <Input
                            placeholder="e.g. Morning 9am 12pm, Afternoon 2 5pm"
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
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Request Published!</h1>
              <div className="glass-card rounded-2xl p-6 md:p-8 border border-glass-border space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-foreground font-medium">Your JV/JD request has been published</p>
                    <p className="text-sm text-muted-foreground">Property published with verified data</p>
                  </div>
                </div>
                <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                  <p className="text-sm font-medium text-primary mb-2">What happens next:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                    <li>Basic information visible to potential partners</li>
                    <li>Matched with suitable JV/JD developers based on preferences</li>
                    <li>You'll be notified when developers respond</li>
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

export default LandownerJointVenture;
