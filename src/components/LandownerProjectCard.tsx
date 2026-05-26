import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Hammer,
  Handshake,
  Palette,
  Wrench,
  Edit,
  Calendar,
  MapPin,
  Home,
  MapPinned,
  Ruler,
  Compass,
  TrafficCone,
  SquareChartGantt,
  Calculator,
  ArrowRight,
  LayoutGrid,
  User,
  HardHat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThreeDTiltCard from "./ThreeDTiltCard";
import { getLandownerTheme, type LandownerType } from "./cardThemes";

const TYPE_ICONS = {
  "contract-construction": Hammer,
  "joint-venture": Handshake,
  interior: Palette,
  reconstruction: Wrench,
};

const TYPE_LABELS = {
  "contract-construction": "Contract Construction",
  "joint-venture": "Joint Venture / JD",
  interior: "Interior Architecture",
  reconstruction: "Renovation / Repaint",
};

const TYPE_PATHS = {
  "contract-construction": "/landowner/contract-construction",
  "joint-venture": "/landowner/joint-venture",
  interior: "/landowner/interior",
  reconstruction: "/landowner/reconstruction",
};

const CONTRACT_CONSTRUCTION_BLURB =
  "Contract construction: full build outsourced to a professional contractor with agreed price and timeline.";

const categoryLabel = (cat: string) =>
  cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : "";

type InteriorContactPayload = {
  has_poc?: boolean;
  name?: string;
  mobile?: string;
  availability?: string;
  timing?: string;
};

export type LandownerProject = {
  type: string;
  submittedAt?: string;
  propertyLocation?: {
    city?: string;
    locality?: string;
    ward?: string;
    landmark?: string;
    address?: string;
    googleMapsLocation?: string;
    streetName?: string;
    societyName?: string;
  };
  propertyDetails?: {
    dimensions?: string;
    facing?: string;
    roadWidth?: string;
    isCornerProperty?: boolean;
    cornerFacings?: string;
  };
  verification?: { khathaType?: string; ekhathaStatus?: string };
  jvPreferences?: {
    postConstructionExpectation?: string[];
    hasPresetIdea?: string;
    presetIdeaExplain?: string; // Preferred building type / development vision
  };
  feasibility?: { far?: string; allowedFloors?: string; totalBuildableArea?: number };
  far?: string;
  farDetails?: {
    effective_far?: number;
    total_buildable_area_sqft?: number;
    floors_allowed?: string;
  };
  projectIntent?: { timeline?: string; category?: string; type?: string };
  contractPreferences?: { construction_mode?: string; constructionMode?: string };
  contract_preferences?: { construction_mode?: string };
  shortExplanation?: string;
  buildingType?: string;
  location?: { address?: string };
  projectScope?: { isEndToEnd?: boolean; scopeExplain?: string };
  /** Interior: space + style (camelCase localStorage or API snake_case). */
  interiorPreferences?: { space_type?: string; spaceType?: string; design_style?: string; designStyle?: string };
  interior_preferences?: { space_type?: string; design_style?: string };
  pointOfContact?: InteriorContactPayload;
  point_of_contact?: InteriorContactPayload;
  timeline?: string;
  propertyType?: { category?: string; type?: string };
  scopeOfWork?: { selected?: string[]; other?: string };
  pidValidation?: unknown;
};

const constructionModeFromProject = (project: LandownerProject): string | null => {
  const c = project.contractPreferences || project.contract_preferences;
  if (!c) return null;
  const v = c.construction_mode || c.constructionMode;
  const s = v != null ? String(v).trim() : "";
  return s || null;
};

type LandownerProjectCardProps = {
  project: LandownerProject;
  index: number;
  variant?: "default" | "compact";
  mode?: "dashboard" | "marketplace";
};

export function LandownerProjectCard({
  project,
  index,
  variant = "default",
  mode = "dashboard",
}: LandownerProjectCardProps) {
  const type = project.type as keyof typeof TYPE_ICONS;
  const Icon = TYPE_ICONS[type] || Hammer;
  const label = TYPE_LABELS[type] || project.type;
  const path = TYPE_PATHS[type] || "/landowner/dashboard";
  const theme = getLandownerTheme(type as LandownerType);

  const areaOnly =
    project.propertyLocation?.ward ||
    project.propertyLocation?.locality ||
    project.propertyLocation?.landmark ||
    project.propertyLocation?.googleMapsLocation ||
    project.location?.address ||
    project.propertyLocation?.address ||
    project.propertyLocation?.streetName ||
    project.propertyLocation?.societyName ||
    " ";

  const content = (
    <>
      <div
        className={`${variant === "compact" ? "h-36" : "h-48"} flex items-center justify-center relative overflow-hidden text-primary-foreground`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.iconBgGradientClassName} opacity-95`} />
        <div
          className={`absolute -top-10 left-0 w-full h-20 ${theme.accentGradientClassName} opacity-70`}
        />
        <Icon className="w-16 h-16 opacity-90 relative z-10" />
        {project.pidValidation && (
          <div className="absolute top-3 right-3 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded border border-white/20">
            Verified
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-black text-lg mb-3">{label}</h3>

        {/* Option 1   Contract Construction */}
        {project.type === "contract-construction" && (() => {
          const contractPref = project.contractPreferences || project.contract_preferences || {};
          const constructionModel =
            contractPref.construction_mode || contractPref.constructionMode || "";
          const pocContract = project.pointOfContact || project.point_of_contact;
          const pocDeclined = pocContract?.has_poc === false;
          const pocShowDetails =
            pocContract &&
            (pocContract.has_poc === true ||
              !!(pocContract.name || "").trim() ||
              !!(pocContract.availability || "").trim() ||
              !!(pocContract.mobile || "").trim());
          return (
          <div className="flex flex-col space-y-1.5 text-sm text-gray-600">
            <div className="order-1">
              {project.propertyDetails?.dimensions && (
                <p>
                  <span className="font-medium text-gray-700">Property dimensions:</span>{" "}
                  {project.propertyDetails.dimensions}
                </p>
              )}
              {(project.projectIntent?.category || project.projectIntent?.type) && (
                <p>
                  <span className="font-medium text-gray-700">Type of construction:</span>{" "}
                  {[categoryLabel(project.projectIntent?.category || ""), project.projectIntent?.type]
                    .filter(Boolean)
                    .join("  ")}
                </p>
              )}
              {constructionModel && (
                <p className="flex items-start gap-1.5">
                  <HardHat className="w-4 h-4 shrink-0 mt-0.5 text-gray-500" aria-hidden />
                  <span>
                    <span className="font-medium text-gray-700">Construction model:</span>{" "}
                    {constructionModel}
                  </span>
                </p>
              )}
              <p>
                <span className="font-medium text-gray-700">Property location:</span> {areaOnly}
              </p>
              {project.propertyDetails?.roadWidth && (
                <p>
                  <span className="font-medium text-gray-700">Road width:</span>{" "}
                  {project.propertyDetails.roadWidth} ft
                </p>
              )}
              {(project.projectIntent?.timeline || project.timeline) && (
                <p>
                  <span className="font-medium text-gray-700">Preferred timeline:</span>{" "}
                  {project.projectIntent?.timeline || project.timeline}
                </p>
              )}
              {pocDeclined && (
                <p className="flex items-start gap-1.5">
                  <User className="w-4 h-4 shrink-0 mt-0.5 text-gray-500" aria-hidden />
                  <span>
                    <span className="font-medium text-gray-700">POC:</span> No separate POC
                  </span>
                </p>
              )}
              {pocShowDetails && !pocDeclined && (
                <>
                  <p className="flex items-start gap-1.5">
                    <User className="w-4 h-4 shrink-0 mt-0.5 text-gray-500" aria-hidden />
                    <span>
                      <span className="font-medium text-gray-700">POC name:</span>{" "}
                      {(pocContract?.name || "").trim() || "—"}
                    </span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <User className="w-4 h-4 shrink-0 mt-0.5 text-gray-500" aria-hidden />
                    <span>
                      <span className="font-medium text-gray-700">POC availability:</span>{" "}
                      {(pocContract?.availability || "").trim() || "—"}
                    </span>
                  </p>
                </>
              )}
            </div>

            <div className="order-2">
              <p className="text-xs text-gray-500 pt-1 border-t border-gray-100 mt-2">
                {project.shortExplanation || CONTRACT_CONSTRUCTION_BLURB}
              </p>
            </div>

            <div className="order-3">
              {(project.far || project.farDetails) && (
                <div className="space-y-0.5 pt-1 border-t border-gray-100 mt-2">
                  <p className="flex items-center gap-1 text-xs">
                    <Calculator className="w-3.5 h-3.5" />
                    <span>
                      <span className="font-medium text-gray-700">FAR:</span>{" "}
                      {project.far ||
                        (project.farDetails?.effective_far != null
                          ? project.farDetails.effective_far.toFixed(2)
                          : " ")}
                    </span>
                  </p>
                  {(project.farDetails?.total_buildable_area_sqft ||
                    project.feasibility?.totalBuildableArea) && (
                    <p className="text-[11px] text-gray-500">
                      <span className="font-medium text-gray-700">Max built-up area:</span>{" "}
                      {Math.round(
                        (project.farDetails?.total_buildable_area_sqft ||
                          project.feasibility?.totalBuildableArea ||
                          0) as number
                      ).toLocaleString()}{" "}
                      sq ft
                    </p>
                  )}
                  {project.farDetails?.floors_allowed && (
                    <p className="text-[11px] text-gray-500">
                      <span className="font-medium text-gray-700">Floors allowed:</span>{" "}
                      {project.farDetails.floors_allowed}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          );
        })()}

        {/* Option 2   JV / JD */}
        {project.type === "joint-venture" && (() => {
          const jvConstructionMode = constructionModeFromProject(project);
          return (
          <div className="rounded-xl border border-[#e7e3d9] bg-[#f8f7f3] p-3">
            <div className="grid grid-cols-[140px_1fr] gap-x-2.5 gap-y-1 text-xs">
              <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                <SquareChartGantt className="h-3.5 w-3.5 text-[#b0893d]" />
                Project Type
              </p>
              <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b]">JV / JD</p>

              {jvConstructionMode && (
                <>
                  <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                    <HardHat className="h-3.5 w-3.5 text-[#b0893d]" />
                    Construction model
                  </p>
                  <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b] break-words">{jvConstructionMode}</p>
                </>
              )}

              <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                <MapPinned className="h-3.5 w-3.5 text-[#b0893d]" />
                Location
              </p>
              <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b] break-words">{areaOnly}</p>

              {project.propertyDetails?.dimensions && (
                <>
                  <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                    <Ruler className="h-3.5 w-3.5 text-[#b0893d]" />
                    Size
                  </p>
                  <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b]">{project.propertyDetails.dimensions}</p>
                </>
              )}
              {project.propertyDetails?.facing && (
                <>
                  <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                    <Compass className="h-3.5 w-3.5 text-[#b0893d]" />
                    Facing
                  </p>
                  <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b]">{project.propertyDetails.facing}</p>
                </>
              )}
              {project.propertyDetails?.roadWidth && (
                <>
                  <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                    <TrafficCone className="h-3.5 w-3.5 text-[#b0893d]" />
                    Road Width
                  </p>
                  <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b]">
                    {project.propertyDetails.roadWidth} ft{project.propertyDetails.isCornerProperty ? " (Front)" : ""}
                  </p>
                </>
              )}
              {(project.projectIntent?.timeline || project.timeline) && (
                <>
                  <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                    <Calendar className="h-3.5 w-3.5 text-[#b0893d]" />
                    Timeline
                  </p>
                  <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b]">
                    {project.projectIntent?.timeline || project.timeline}
                  </p>
                </>
              )}
              {project.feasibility?.far && (
                <>
                  <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                    <Calculator className="h-3.5 w-3.5 text-[#b0893d]" />
                    FAR
                  </p>
                  <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b]">{project.feasibility.far}</p>
                </>
              )}
            </div>
          </div>
          );
        })()}

        {/* Option 3   Interior */}
        {project.type === "interior" && (() => {
          const interiorPref = project.interiorPreferences || project.interior_preferences || {};
          const interiorSpaceType = interiorPref.space_type || interiorPref.spaceType;
          const interiorDesignStyle = interiorPref.design_style || interiorPref.designStyle;
          const interiorConstructionMode = constructionModeFromProject(project);
          const pocRaw = project.pointOfContact || project.point_of_contact;
          const pocIntDeclined = pocRaw?.has_poc === false;
          const pocIntShowDetails =
            pocRaw &&
            (pocRaw.has_poc === true ||
              !!(pocRaw.name || "").trim() ||
              !!(pocRaw.availability || "").trim() ||
              !!(pocRaw.mobile || "").trim());
          return (
          <div className="rounded-xl border border-[#e7e3d9] bg-[#f8f7f3] p-3">
            <div className="grid grid-cols-[140px_1fr] gap-x-2.5 gap-y-1 text-xs">
              <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                <SquareChartGantt className="h-3.5 w-3.5 text-[#b0893d]" />
                Project Type
              </p>
              <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b]">Interior</p>

              {project.buildingType && (
                <>
                  <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                    <Home className="h-3.5 w-3.5 text-[#b0893d]" />
                    Building Type
                  </p>
                  <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b]">{project.buildingType}</p>
                </>
              )}
              {interiorSpaceType && (
                <>
                  <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                    <LayoutGrid className="h-3.5 w-3.5 text-[#b0893d]" />
                    Space type
                  </p>
                  <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b] break-words">{interiorSpaceType}</p>
                </>
              )}
              {interiorDesignStyle && (
                <>
                  <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                    <Palette className="h-3.5 w-3.5 text-[#b0893d]" />
                    Design style
                  </p>
                  <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b] break-words">{interiorDesignStyle}</p>
                </>
              )}
              {interiorConstructionMode && (
                <>
                  <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                    <HardHat className="h-3.5 w-3.5 text-[#b0893d]" />
                    Construction model
                  </p>
                  <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b] break-words">{interiorConstructionMode}</p>
                </>
              )}
              <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                <MapPinned className="h-3.5 w-3.5 text-[#b0893d]" />
                Location
              </p>
              <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b] break-words">{areaOnly}</p>
              {project.projectScope && (
                <>
                  <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                    <Edit className="h-3.5 w-3.5 text-[#b0893d]" />
                    Scope
                  </p>
                  <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b] break-words">
                    {project.projectScope.isEndToEnd
                      ? "End-to-end project"
                      : `Partial — ${project.projectScope.scopeExplain || "See details"}`}
                  </p>
                </>
              )}
              {project.timeline && (
                <>
                  <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                    <Calendar className="h-3.5 w-3.5 text-[#b0893d]" />
                    Commencement
                  </p>
                  <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b]">{project.timeline}</p>
                </>
              )}
              {pocIntDeclined && (
                <>
                  <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                    <User className="h-3.5 w-3.5 text-[#b0893d]" />
                    POC
                  </p>
                  <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b]">No separate POC</p>
                </>
              )}
              {pocIntShowDetails && !pocIntDeclined && (
                <>
                  <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                    <User className="h-3.5 w-3.5 text-[#b0893d]" />
                    POC name
                  </p>
                  <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b] break-words">
                    {(pocRaw?.name || "").trim() || "—"}
                  </p>
                  <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                    <User className="h-3.5 w-3.5 text-[#b0893d]" />
                    POC availability
                  </p>
                  <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b] break-words">
                    {(pocRaw?.availability || "").trim() || "—"}
                  </p>
                </>
              )}
            </div>
          </div>
          );
        })()}

        {/* Option 4   Reconstruction */}
        {project.type === "reconstruction" && (() => {
          const reconConstructionMode = constructionModeFromProject(project);
          return (
          <div className="rounded-xl border border-[#e7e3d9] bg-[#f8f7f3] p-3">
            <div className="grid grid-cols-[140px_1fr] gap-x-2.5 gap-y-1 text-xs">
              <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                <SquareChartGantt className="h-3.5 w-3.5 text-[#b0893d]" />
                Project Type
              </p>
              <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b]">Renovation/Repaint</p>

              {reconConstructionMode && (
                <>
                  <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                    <HardHat className="h-3.5 w-3.5 text-[#b0893d]" />
                    Construction model
                  </p>
                  <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b] break-words">{reconConstructionMode}</p>
                </>
              )}

              {project.scopeOfWork && (project.scopeOfWork.selected?.length || project.scopeOfWork.other) && (
                <>
                  <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                    <Edit className="h-3.5 w-3.5 text-[#b0893d]" />
                    Scope of Work
                  </p>
                  <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b] break-words">
                    {[...(project.scopeOfWork.selected || []), project.scopeOfWork.other].filter(Boolean).join(", ")}
                  </p>
                </>
              )}
              {project.propertyType && (
                <>
                  <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                    <Home className="h-3.5 w-3.5 text-[#b0893d]" />
                    Property Type
                  </p>
                  <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b]">
                    {[categoryLabel(project.propertyType.category || ""), project.propertyType.type].filter(Boolean).join(" ")}
                  </p>
                </>
              )}
              <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                <MapPinned className="h-3.5 w-3.5 text-[#b0893d]" />
                Work Location
              </p>
              <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b] break-words">{areaOnly}</p>
              {project.timeline && (
                <>
                  <p className="flex items-center gap-1.5 font-semibold text-[#2a3e30]">
                    <Calendar className="h-3.5 w-3.5 text-[#b0893d]" />
                    Commencement
                  </p>
                  <p className="border-l border-[#ddd5c5] pl-2.5 font-medium text-[#27342b]">{project.timeline}</p>
                </>
              )}
            </div>
          </div>
          );
        })()}

        {project.submittedAt && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
            <Calendar className="w-3 h-3" />
            <span>{new Date(project.submittedAt).toLocaleDateString()}</span>
          </div>
        )}

        {mode === "dashboard" && (
          <>
            {variant === "default" && (
              <Link to={path} className="mt-4 block">
                <Button variant="outline" className="w-full group-hover:bg-black group-hover:text-white transition-colors">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Project
                </Button>
              </Link>
            )}
            {variant === "compact" && (
              <div className="mt-3 flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-sm font-medium text-black">View Details</span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>
            )}
          </>
        )}
        {mode === "marketplace" && (
          <p className="mt-3 text-[11px] text-gray-500 pt-3 border-t border-gray-100">
            Landowner identity and contact details are hidden. Express interest in-app to see more.
          </p>
        )}
      </div>
    </>
  );

  const wrapperClass =
    "bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow";

  if (variant === "compact" && mode === "dashboard") {
    return (
      <Link to="/landowner/my-projects">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <ThreeDTiltCard glowGradientClassName={theme.glowGradientClassName} className="rounded-2xl">
            <div className={wrapperClass}>{content}</div>
          </ThreeDTiltCard>
        </motion.div>
      </Link>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <ThreeDTiltCard glowGradientClassName={theme.glowGradientClassName} className="rounded-2xl">
        <div className={wrapperClass}>{content}</div>
      </ThreeDTiltCard>
    </motion.div>
  );
}
