import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, User, Home, BarChart3, Shield, Calendar, Phone } from "lucide-react";
import {
  getAccessToken,
  submitLandownerContractConstruction,
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

const TIMELINE_OPTIONS = [
  "Immediately",
  "Within a month",
  "Within 3 months",
  "Within this year",
  "Exploring options",
];

const PROJECT_TYPES = {
  residential: ["Duplex house", "Villa", "Multi-storey structure", "Others (Free text)"],
  commercial: ["Rental / PG", "Hotel", "Office space", "School", "Others (Free text)"],
  industrial: ["Warehouse", "Factory", "Eccentric structure", "Others (Free text)"],
};

const SECTIONS: StepFormSection[] = [
  { id: "owner", label: "Property Owner", icon: User },
  { id: "property", label: "Property Details", icon: Home },
  { id: "far", label: "FAR & Development Potential", icon: BarChart3 },
  { id: "validation", label: "Property Validation", icon: Shield },
  { id: "planning", label: "Project Planning", icon: Calendar },
  { id: "poc", label: "Point of Contact", icon: Phone },
];

const LandownerContractConstruction = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"brief" | "form" | "done">("brief");
  const [activeSectionId, setActiveSectionId] = useState(SECTIONS[0].id);

  const [landownerName, setLandownerName] = useState("");
  const [propertyDimensions, setPropertyDimensions] = useState("");
  const [propertyDimensionsOther, setPropertyDimensionsOther] = useState("");
  const [ward, setWard] = useState("");
  const [landmark, setLandmark] = useState("");
  const [streetName, setStreetName] = useState("");
  const [societyName, setSocietyName] = useState("");
  const [propertyFacing, setPropertyFacing] = useState("");
  const [googleMapsLocation, setGoogleMapsLocation] = useState("");
  const [isCornerProperty, setIsCornerProperty] = useState(false);
  const [cornerFacings, setCornerFacings] = useState("");
  const [roadWidth, setRoadWidth] = useState("");
  const [isAreaGated, setIsAreaGated] = useState<"yes" | "no" | "">("");
  const [hasPoc, setHasPoc] = useState<"yes" | "no" | "">("");
  const [pocName, setPocName] = useState("");
  const [pocMobile, setPocMobile] = useState("");
  const [pocAvailability, setPocAvailability] = useState("");
  const [pocTiming, setPocTiming] = useState("");

  const [wantPidValidation, setWantPidValidation] = useState(false);
  const [pidNumber, setPidNumber] = useState("");
  const [verifiedOwnerName, setVerifiedOwnerName] = useState("");
  const [streetId, setStreetId] = useState("");
  const [plotNumber, setPlotNumber] = useState("");
  const [taxPaymentHistory, setTaxPaymentHistory] = useState("");
  const [eKhathaInfo, setEKhathaInfo] = useState("");

  const [timeline, setTimeline] = useState("");
  const [constructionMode, setConstructionMode] = useState("");
  const [projectCategory, setProjectCategory] = useState<"residential" | "commercial" | "industrial">("residential");
  const [projectType, setProjectType] = useState("");
  const [projectTypeOther, setProjectTypeOther] = useState("");
  const [contractExplanation, setContractExplanation] = useState("");

  const [zone, setZone] = useState<FARZone | undefined>(undefined);
  const [farResult, setFarResult] = useState<FARResult | null>(null);
  const [farError, setFarError] = useState<string | null>(null);
  const [farLoading, setFarLoading] = useState(false);
  const [planImageUrl, setPlanImageUrl] = useState<string | null>(null);
  const [planImageLoading, setPlanImageLoading] = useState(false);
  const [planImageError, setPlanImageError] = useState<string | null>(null);

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
    if (projectCategory === "commercial") return "COMMERCIAL";
    if (projectCategory === "industrial") return "INDUSTRIAL";
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
    const computedFar = await ensureFarCalculated();

    const payload = {
      landowner_name: landownerName,
      property_location: {
        city: "Bangalore",
        ward,
        landmark,
        street_name: streetName.trim() || undefined,
        society_name: societyName.trim() || undefined,
        google_maps_location: googleMapsLocation,
      },
      property_details: {
        dimensions: propertyDimensions === "Others (Free text)" ? propertyDimensionsOther : propertyDimensions,
        facing: propertyFacing,
        is_corner_property: isCornerProperty,
        corner_facings: isCornerProperty ? cornerFacings : "",
        road_width: roadWidth,
        is_area_gated: isAreaGated || undefined,
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
      far: computedFar ? computedFar.effective_far.toFixed(2) : undefined,
      pid_validation: wantPidValidation
        ? {
            pid_number: pidNumber,
            verified_owner_name: verifiedOwnerName,
            ward,
            street_id: streetId,
            plot_number: plotNumber,
            tax_payment_history: taxPaymentHistory,
            e_khatha_info: eKhathaInfo,
          }
        : null,
      project_intent: {
        timeline,
        category: projectCategory,
        type: projectType === "Others (Free text)" ? projectTypeOther : projectType,
      },
      contract_preferences: constructionMode.trim()
        ? { construction_mode: constructionMode.trim() }
        : undefined,
    };

    const token = getAccessToken();
    if (token) {
      setSubmitting(true);
      setSubmitError(null);
      try {
        await createPropertyAndProjectFromLandownerForm(
          payload,
          "CONTRACT_CONSTRUCTION",
          { publish: true }
        );
        try {
          await submitLandownerContractConstruction(payload);
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
    const pi = payload.project_intent || {};
    const formData = {
      type: "contract-construction",
      landownerName,
      propertyLocation: {
        city: pl.city,
        ward: pl.ward,
        landmark: pl.landmark,
        address: pl.google_maps_location || googleMapsLocation,
        googleMapsLocation: pl.google_maps_location || googleMapsLocation,
        streetName: pl.street_name,
        societyName: pl.society_name,
      },
      propertyDetails: {
        dimensions: pd.dimensions,
        facing: pd.facing,
        roadWidth: pd.road_width,
        isCornerProperty: pd.is_corner_property,
        cornerFacings: pd.corner_facings,
        isAreaGated: pd.is_area_gated,
      },
        far: payload.far,
        farDetails: computedFar || undefined,
      pidValidation: payload.pid_validation,
      projectIntent: { timeline: pi.timeline, category: pi.category, type: pi.type },
      shortExplanation: contractExplanation.trim() || undefined,
      isAreaGated: payload.property_details?.is_area_gated,
      pointOfContact: payload.point_of_contact,
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
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Contract Construction</h1>
              <div className="rounded-2xl p-6 md:p-8 space-y-6">
                <p className="text-foreground leading-relaxed">
                  Contract construction means outsourcing the entire construction process to a professional external agency. 
                  The contractor signs a legal agreement and takes responsibility for execution, materials, approvals, quality, 
                  and timelines in exchange for an agreed-upon price.
                </p>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">What you'll provide:</h3>
                  <ul className="space-y-1 text-sm text-foreground list-disc list-inside">
                    <li>Property details and specifications</li>
                    <li>Free FAR calculation report</li>
                    <li>Optional property validation (PID)</li>
                    <li>Project intent and timeline</li>
                  </ul>
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
                submitDisabled={
                  !landownerName.trim() ||
                  !propertyDimensions ||
                  !googleMapsLocation.trim() ||
                  !propertyFacing ||
                  !roadWidth ||
                  !constructionMode.trim() ||
                  !timeline ||
                  !projectType ||
                  submitting
                }
                isSubmitting={submitting}
              >
                {activeSectionId === "owner" && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold mb-2 block">Name of the landowner / property owner</Label>
                      <Input placeholder="Your full name" value={landownerName} onChange={(e) => setLandownerName(e.target.value)} />
                    </div>
                  </div>
                )}

                {activeSectionId === "property" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">What is the property dimension?</Label>
                    <Select value={propertyDimensions} onValueChange={setPropertyDimensions}>
                      <SelectTrigger><SelectValue placeholder="Select dimensions" /></SelectTrigger>
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
                    <Label className="text-base font-semibold mb-2 block">Full address / location *</Label>
                    <CityAreaInput
                      placeholder="Select area (e.g. HSR Layout, Koramangala, Whitefield)"
                      value={googleMapsLocation}
                      onChange={setGoogleMapsLocation}
                      className="w-full mb-2"
                    />
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Ward number / name</Label>
                    <Input placeholder="Ward number / name" value={ward} onChange={(e) => setWard(e.target.value)} className="w-full sm:max-w-xs" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Street name</Label>
                    <Input placeholder="Street name" value={streetName} onChange={(e) => setStreetName(e.target.value)} className="w-full" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Society name</Label>
                    <Input placeholder="Society / apartment name" value={societyName} onChange={(e) => setSocietyName(e.target.value)} className="w-full" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Landmark nearby</Label>
                    <Input placeholder="e.g., Near Metro Station" value={landmark} onChange={(e) => setLandmark(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Is the area gated?</Label>
                    <RadioGroup value={isAreaGated} onValueChange={(v) => setIsAreaGated(v as "yes" | "no")} className="flex flex-wrap gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="gated-yes" />
                        <Label htmlFor="gated-yes" className="font-normal cursor-pointer">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="gated-no" />
                        <Label htmlFor="gated-no" className="font-normal cursor-pointer">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <BangaloreMap className="mt-4" height={320} area={googleMapsLocation} facing={propertyFacing} />
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
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox id="corner-property" checked={isCornerProperty} onCheckedChange={(c) => setIsCornerProperty(c as boolean)} />
                      <Label htmlFor="corner-property" className="font-normal cursor-pointer">Is it a corner property?</Label>
                    </div>
                    {isCornerProperty && (
                      <Input placeholder="If Yes → Specify the facing" value={cornerFacings} onChange={(e) => setCornerFacings(e.target.value)} className="mt-2" />
                    )}
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Road width in front of the property?</Label>
                    <p className="text-sm text-muted-foreground mb-1">(If corner property → mention the biggest road width)</p>
                    <Input type="number" placeholder="Feet" value={roadWidth} onChange={(e) => setRoadWidth(e.target.value)} />
                  </div>
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
                  </div>
                </div>
                )}

                {activeSectionId === "far" && (
                <div className="space-y-6">
                  <div className="group rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg space-y-2">
                    <p className="text-sm font-semibold text-primary">FAR & Maximum Built-up Area (indicative)</p>
                    {farError && <p className="text-xs text-destructive">{farError}</p>}
                    {farLoading && <p className="text-xs text-muted-foreground">Calculating FAR…</p>}
                    {farResult && !farLoading && (
                      <>
                        <p className="text-xs text-muted-foreground">
                          Base FAR {farResult.base_far.toFixed(2)}
                          {farResult.premium_far_increment
                            ? ` + Premium ${farResult.premium_far_increment.toFixed(2)} = `
                            : " = "}
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
                  </div>
                </div>
                )}

                {activeSectionId === "validation" && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Checkbox id="want-pid" checked={wantPidValidation} onCheckedChange={(c) => setWantPidValidation(c as boolean)} />
                      <Label htmlFor="want-pid" className="font-normal cursor-pointer">Do you require property validation?</Label>
                    </div>
                    {wantPidValidation && (
                      <div className="space-y-3 pl-6 border-l-2 border-primary/20">
                        <div>
                          <Label className="text-sm text-muted-foreground mb-1 block">PID Number (BBMP Tax Portal)</Label>
                          <Input placeholder="PID Number" value={pidNumber} onChange={(e) => setPidNumber(e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground mb-1 block">Verified Property Owner Name (Gov record)</Label>
                          <Input placeholder="As per government record" value={verifiedOwnerName} onChange={(e) => setVerifiedOwnerName(e.target.value)} />
                        </div>
                        <p className="text-sm font-medium text-foreground">Property location details:</p>
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">Ward</Label>
                            <Input placeholder="Ward" value={ward} onChange={(e) => setWard(e.target.value)} />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">Street ID</Label>
                            <Input placeholder="Street ID" value={streetId} onChange={(e) => setStreetId(e.target.value)} />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">Plot Number</Label>
                            <Input placeholder="Plot Number" value={plotNumber} onChange={(e) => setPlotNumber(e.target.value)} />
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground mb-1 block">Tax payment history (dues and receipts)</Label>
                          <Textarea placeholder="Details" value={taxPaymentHistory} onChange={(e) => setTaxPaymentHistory(e.target.value)} rows={2} />
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground mb-1 block">E-Khatha information</Label>
                          <Input placeholder="E-Khatha details" value={eKhathaInfo} onChange={(e) => setEKhathaInfo(e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                )}

                {activeSectionId === "planning" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Preferred construction model *</Label>
                    <Select value={constructionMode} onValueChange={setConstructionMode}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select how you want to contract the work" />
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
                    <Label className="text-base font-semibold mb-2 block">Preferred timeline to begin work *</Label>
                    <RadioGroup value={timeline} onValueChange={setTimeline} className="space-y-2">
                      {TIMELINE_OPTIONS.map((opt) => (
                        <div key={opt} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt} id={`timeline-${opt}`} />
                          <Label htmlFor={`timeline-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">What type of project are you planning to build?</Label>
                    <div className="space-y-3">
                      <Select
                        value={projectCategory}
                        onValueChange={(v) => {
                          setProjectCategory(v as "residential" | "commercial" | "industrial");
                          setProjectType("");
                        }}
                      >
                        <SelectTrigger className="w-full sm:max-w-xs"><SelectValue placeholder="Category" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="residential">Residential Project</SelectItem>
                          <SelectItem value="commercial">Commercial Project</SelectItem>
                          <SelectItem value="industrial">Industrial Project</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={projectType} onValueChange={setProjectType}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {PROJECT_TYPES[projectCategory].map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(projectType === "Others (Free text)" || projectType?.toLowerCase().includes("other")) && (
                        <Input placeholder="Specify (Free text)" value={projectTypeOther} onChange={(e) => setProjectTypeOther(e.target.value)} />
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Short explanation of contract construction</Label>
                    <Textarea
                      placeholder="Brief description of what you need (e.g. full construction, turnkey, specific scope)"
                      value={contractExplanation}
                      onChange={(e) => setContractExplanation(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                )}

                {activeSectionId === "poc" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Is there any point of contact (POC) for this project?</Label>
                    <RadioGroup value={hasPoc} onValueChange={(v) => setHasPoc(v as "yes" | "no")} className="flex flex-wrap gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="poc-yes" />
                        <Label htmlFor="poc-yes" className="font-normal cursor-pointer">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="poc-no" />
                        <Label htmlFor="poc-no" className="font-normal cursor-pointer">No</Label>
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
                    <p className="text-foreground font-medium">Your project has been published</p>
                    <p className="text-sm text-muted-foreground">Contractors can now discover and bid on your project</p>
                  </div>
                </div>
                <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                  <p className="text-sm font-medium text-primary mb-2">What happens next:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                    <li>Free FAR calculation report provided</li>
                    <li>Project published on Opportunities</li>
                    <li>Contractors can discover and bid on the project</li>
                    <li>You'll be notified when contractors respond</li>
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

export default LandownerContractConstruction;
