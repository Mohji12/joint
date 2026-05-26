import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Hammer,
  Handshake,
  Palette,
  Wrench,
  Edit,
  Calendar,
  Building2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThreeDTiltCard from "./ThreeDTiltCard";
import { getBuilderTheme, type BuilderType } from "./cardThemes";

const TYPE_ICONS = {
  "contract-construction": Hammer,
  "joint-venture": Handshake,
  interior: Palette,
  reconstruction: Wrench,
};

const TYPE_LABELS = {
  "contract-construction": "Contract Construction",
  "joint-venture": "JV / JD Developer",
  interior: "Interior Architect",
  reconstruction: "Renovation / Repaint",
};

const TYPE_PATHS = {
  "contract-construction": "/builder/contract-construction",
  "joint-venture": "/builder/joint-venture",
  interior: "/builder/interior",
  reconstruction: "/builder/reconstruction",
};

const TYPE_COLORS = {
  "contract-construction": "bg-primary",
  "joint-venture": "bg-primary",
  interior: "bg-primary",
  reconstruction: "bg-primary",
};

const PRICING_DISCLAIMER =
  "Disclaimer: Final cost may vary based on location, scope, specifications, and requirements.";
const COST_DISCLAIMER = "Costs may vary by scope, materials, and project type reference only.";

const formatArea = (addr: string | undefined) =>
  addr?.trim() ? addr : " ";

const formatList = (arr: string[] | undefined) =>
  arr?.length ? arr.join(", ") : " ";

export type BuilderProfile = {
  profileId?: string;
  type: string;
  submittedAt?: string;
  companyName?: string;
  yearsExperience?: string;
  establishmentDate?: string;
  address?: string;
  licenseRera?: string;
  builderLicense?: string;
  reraRegistration?: string;
  projectTypes?: string[];
  projectCaps?: string[];
  projectsCompleted?: string;
  projectDetails?: string;
  projectScale?: string;
  teamSize?: string;
  teamType?: string;
  teamDetails?: string;
  subcontractorScopes?: string[];
  subcontractorOther?: string;
  typicalSize?: string;
  typicalSizeOther?: string;
  pricing?: {
    residential?: { basic?: string; standard?: string; luxury?: string };
    commercial?: { basic?: string; standard?: string; luxury?: string };
    industrial?: { basic?: string; standard?: string };
  };
  /** Interior: single free-text approximate pricing (preferred). */
  approximateInteriorPricing?: string;
  price1200?: string;
  price1500?: string;
  price1800?: string;
  priceOther?: string;
  pricingNote?: string;
  imageCount?: number;
  recentProjects?: Array<{
    nameLocation?: string;
    location?: string;
    builtUpSft?: string;
    type?: string;
    durationMonths?: string;
    imageCount?: number;
  }>;
  jvArrangements?: string[];
  reraYesNo?: string;
  reraProjects?: string;
  reraProjectNames?: string;
  projectTypesInterior?: string[];
  endToEndOrPartial?: string;
  workTypes?: string[];
  workTypeOther?: string;
  verified?: boolean;
  similarProjectsDesc?: string;
};

type BuilderProfileCardProps = {
  profile: BuilderProfile;
  index: number;
  variant?: "default" | "compact";
  mode?: "dashboard" | "marketplace";
};

export function BuilderProfileCard({
  profile,
  index,
  variant = "default",
  mode = "dashboard",
}: BuilderProfileCardProps) {
  const type = profile.type as keyof typeof TYPE_ICONS;
  const Icon = TYPE_ICONS[type] || Hammer;
  const label = TYPE_LABELS[type] || profile.type;
  const path = TYPE_PATHS[type] || "/builder/dashboard";
  const color = TYPE_COLORS[type] || "bg-primary";
  const theme = getBuilderTheme(type as BuilderType);

  const content = (
    <>
      <div
        className={`${variant === "compact" ? "h-36" : "h-48"} flex items-center justify-center relative text-primary-foreground overflow-hidden`}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br ${theme.iconBgGradientClassName} opacity-95`}
        />
        {/* Top accent sheen for extra 3D depth */}
        <div className={`absolute -top-10 left-0 w-full h-20 ${theme.accentGradientClassName} opacity-70`} />
        <Icon className="w-16 h-16 opacity-90 relative z-10" />
        {profile.verified && (
          <div
            className="absolute top-3 right-3 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded border border-white/20"
          >
            Verified
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-foreground text-lg mb-3">{label}</h3>

        {/* Option 1: Contract Construction   Company info, Portfolio, Team, Pricing, Testimonials */}
        {profile.type === "contract-construction" && (
          <div className="flex flex-col space-y-3 text-sm text-muted-foreground">
            <div className="order-1">
              <p className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider mb-1">Company Information</p>
              <p><span className="font-medium text-foreground">Company name / Sole proprietor:</span> {profile.companyName || " "}</p>
              {profile.projectsCompleted && (
                <p><span className="font-medium text-foreground">Total projects completed:</span> {profile.projectsCompleted}</p>
              )}
              {profile.projectTypes?.length ? (
                <p><span className="font-medium text-foreground">Types of construction:</span> {formatList(profile.projectTypes)}</p>
              ) : null}
              <p><span className="font-medium text-foreground">Years of experience:</span> {profile.yearsExperience || profile.establishmentDate || " "}</p>
              <p><span className="font-medium text-foreground">Office location (area only):</span> {formatArea(profile.address)}</p>
              {profile.licenseRera && (
                <p><span className="font-medium text-foreground">Builder license:</span> {profile.licenseRera}</p>
              )}
            </div>
            {(profile.pricing && (profile.pricing.residential?.basic || profile.pricing.commercial?.basic || profile.pricing.industrial?.basic)) && (
              <div className="pt-2 border-t border-border order-2">
                <p className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider mb-1">Pricing (Approximate)</p>
                <p className="text-xs text-muted-foreground mb-1">{PRICING_DISCLAIMER}</p>
                {profile.pricing.residential?.basic && <p className="text-xs">Residential duplex/villa: ₹{profile.pricing.residential.basic}/sft</p>}
                {profile.pricing.commercial?.basic && <p className="text-xs">Commercial PG/rental building: ₹{profile.pricing.commercial.basic}/sft</p>}
                {profile.pricing.industrial?.basic && <p className="text-xs">Industrial factory building: ₹{profile.pricing.industrial.basic}/sft</p>}
              </div>
            )}
            {(profile.projectDetails || profile.imageCount) && (
              <div className="pt-2 border-t border-border order-3">
                <p className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider mb-1">Portfolio</p>
                <p><span className="font-medium text-foreground">Last 2 completed projects:</span> {profile.projectDetails || " "}</p>
                {profile.imageCount ? (
                  <p className="text-xs text-muted-foreground">Completion timeline & media: max 5 pictures or 15-sec clip ({profile.imageCount} uploaded)</p>
                ) : null}
              </div>
            )}
            {(profile.teamType || profile.subcontractorScopes?.length) && (
              <div className="pt-2 border-t border-border order-4">
                <p className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider mb-1">Team Details</p>
                <p><span className="font-medium text-foreground">Full in-house OR outsourced:</span> {profile.teamType === "in-house" ? "Full in-house team." : profile.subcontractorScopes?.length ? `In-house except ${formatList(profile.subcontractorScopes)}${profile.subcontractorOther ? `, ${profile.subcontractorOther}` : ""} (outsourced with monitoring).` : " "}</p>
              </div>
            )}
            <div className="pt-2 border-t border-border order-5">
              <p className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider mb-1">Testimonials</p>
              <p className="text-xs text-muted-foreground">Maximum 3 (photo/clip)   visible to landowners after shortlisting</p>
            </div>
          </div>
        )}

        {/* Option 2: JV / JD   Builder credibility: Company, Sharing model, Portfolio, Team, RERA, Project scale */}
        {profile.type === "joint-venture" && (
          <div className="flex flex-col space-y-3 text-sm text-muted-foreground">
            <div className="order-1">
              <p className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider mb-1">Company</p>
              <p><span className="font-medium text-foreground">Company name:</span> {profile.companyName || " "}</p>
              {profile.projectsCompleted && (
                <p><span className="font-medium text-foreground">Total projects completed:</span> {profile.projectsCompleted}</p>
              )}
              {profile.projectCaps?.length ? (
                <p><span className="font-medium text-foreground">Construction types:</span> {formatList(profile.projectCaps)}</p>
              ) : null}
              <p><span className="font-medium text-foreground">Experience:</span> {profile.yearsExperience || " "}</p>
              <p><span className="font-medium text-foreground">Office location:</span> {formatArea(profile.address)}</p>
              {(profile.builderLicense || profile.reraRegistration) && (
                <p><span className="font-medium text-foreground">License (if available):</span> {[profile.builderLicense, profile.reraRegistration].filter(Boolean).join("; ")}</p>
              )}
            </div>
            {profile.jvArrangements?.length ? (
              <div className="pt-2 border-t border-border order-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Sharing Model</p>
                <p><span className="font-medium text-foreground">Square feet sharing / Revenue sharing / Post-completion:</span> {formatList(profile.jvArrangements)}</p>
              </div>
            ) : null}
            {profile.recentProjects?.length ? (
              <div className="pt-2 border-t border-border order-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Portfolio</p>
                <p><span className="font-medium text-foreground">Last 2 projects:</span></p>
                <ul className="list-disc list-inside text-xs mt-1 space-y-0.5">
                  {profile.recentProjects.slice(0, 2).map((rp, i) => (
                    <li key={i}>
                      {rp.nameLocation || rp.location || "Project"}   {rp.durationMonths ? `${rp.durationMonths} months` : ""} {rp.imageCount ? `(max 5 pics / 2 clips: ${rp.imageCount})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {(profile.teamType || profile.subcontractorScopes?.length || profile.teamDetails) && (
              <div className="pt-2 border-t border-border order-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Team Details</p>
                <p><span className="font-medium text-foreground">In-house vs outsourced:</span> {profile.teamDetails || (profile.teamType === "in-house" ? "Complete in-house team." : `In-house except ${formatList(profile.subcontractorScopes)} (outsourced with monitoring).`)}</p>
              </div>
            )}
            {profile.reraYesNo === "yes" && (profile.reraProjects || profile.reraProjectNames) && (
              <div className="pt-2 border-t border-border order-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">RERA Experience (if applicable)</p>
                <p><span className="font-medium text-foreground">Number of RERA projects:</span> {profile.reraProjects || " "}</p>
                {profile.reraProjectNames && <p><span className="font-medium text-foreground">Project names:</span> {profile.reraProjectNames}</p>}
              </div>
            )}
            {(profile.projectScale || profile.teamSize) && (
              <div className="pt-2 border-t border-border order-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Project Scale</p>
                {profile.projectScale && <p><span className="font-medium text-foreground">Wallet size handled:</span> {profile.projectScale}</p>}
                {profile.teamSize && <p><span className="font-medium text-foreground">Team size:</span> {profile.teamSize}</p>}
              </div>
            )}
          </div>
        )}

        {/* Option 3: Interior Architect / Designer   Company, Project types, 2 previous projects, Approximate pricing */}
        {profile.type === "interior" && (
          <div className="flex flex-col space-y-3 text-sm text-muted-foreground">
            <div className="order-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Company</p>
              <p><span className="font-medium text-foreground">Company name:</span> {profile.companyName || " "}</p>
              <p><span className="font-medium text-foreground">Establishment year / experience:</span> {profile.yearsExperience || profile.establishmentDate || " "}</p>
              <p><span className="font-medium text-foreground">Office address:</span> {formatArea(profile.address)}</p>
            </div>
            <div className="pt-2 border-t border-border order-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Project types</p>
              <p><span className="font-medium text-foreground">Residential / Commercial / Industrial:</span> {formatList(profile.projectTypes || profile.projectTypesInterior)}</p>
              {profile.endToEndOrPartial && (
                <p><span className="font-medium text-foreground">End-to-end or specific work:</span> {profile.endToEndOrPartial}</p>
              )}
            </div>
            {profile.recentProjects?.length ? (
              <div className="pt-2 border-t border-border order-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">2 previous projects (with media)</p>
                <ul className="list-disc list-inside text-xs mt-1 space-y-0.5">
                  {profile.recentProjects.slice(0, 2).map((rp, i) => (
                    <li key={i}>
                      {rp.location || rp.nameLocation || "Project"}   {rp.type ? `${rp.type}, ` : ""}{rp.durationMonths ? `${rp.durationMonths} months` : ""} {rp.imageCount ? `(${rp.imageCount} media)` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {(() => {
              const interiorPricingLine =
                profile.approximateInteriorPricing?.trim() ||
                [profile.price1200, profile.price1500, profile.price1800, profile.priceOther]
                  .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
                  .join(" · ");
              if (!interiorPricingLine) return null;
              return (
                <div className="pt-2 border-t border-border order-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Approximate pricing</p>
                  <p className="text-xs text-muted-foreground mb-1">{COST_DISCLAIMER}</p>
                  <p className="text-xs text-foreground">{interiorPricingLine}</p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Option 4: Reconstruction / Repair / Repaint   Company, Types of work, Recent works, Team, Typical scope */}
        {profile.type === "reconstruction" && (
          <div className="flex flex-col space-y-3 text-sm text-muted-foreground">
            <div className="order-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Company</p>
              <p><span className="font-medium text-foreground">Company name:</span> {profile.companyName || " "}</p>
              {profile.projectsCompleted && (
                <p><span className="font-medium text-foreground">Total projects completed:</span> {profile.projectsCompleted}</p>
              )}
              {(profile.projectCaps?.length || profile.workTypes?.length) && (
                <p><span className="font-medium text-foreground">Types of work:</span> {formatList(profile.projectCaps || profile.workTypes)}{profile.workTypeOther ? `, ${profile.workTypeOther}` : ""}</p>
              )}
              <p><span className="font-medium text-foreground">Office location:</span> {formatArea(profile.address)}</p>
              <p><span className="font-medium text-foreground">Experience:</span> {profile.yearsExperience || " "}</p>
              {(profile.builderLicense || profile.licenseRera || profile.reraRegistration) && (
                <p><span className="font-medium text-foreground">Construction licenses:</span> {[profile.builderLicense, profile.licenseRera, profile.reraRegistration].filter(Boolean).join("; ")}</p>
              )}
            </div>
            {(profile.projectDetails || profile.similarProjectsDesc || profile.imageCount) && (
              <div className="pt-2 border-t border-border order-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Recent completed works (with pictures)</p>
                <p>{profile.projectDetails || profile.similarProjectsDesc || " "} {profile.imageCount ? `(${profile.imageCount} images)` : ""}</p>
              </div>
            )}
            {(profile.teamType || profile.subcontractorScopes?.length) && (
              <div className="pt-2 border-t border-border order-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Team structure</p>
                <p><span className="font-medium text-foreground">In-house vs outsourced:</span> {profile.teamType === "in-house" ? "Complete in-house team." : `In-house except ${formatList(profile.subcontractorScopes)}${profile.subcontractorOther ? `, ${profile.subcontractorOther}` : ""} (outsourced with monitoring).`}</p>
              </div>
            )}
            {(profile.workTypes?.length || profile.workTypeOther) && (
              <div className="pt-2 border-t border-border order-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Typical scope (major vs minor work specialization)</p>
                <p>{formatList(profile.workTypes)}{profile.workTypeOther ? `; ${profile.workTypeOther}` : ""}</p>
              </div>
            )}
          </div>
        )}

        {profile.submittedAt && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
            <Calendar className="w-3 h-3" />
            <span>{new Date(profile.submittedAt).toLocaleDateString()}</span>
          </div>
        )}

        {mode === "dashboard" && (
          <>
            {variant === "default" && (
              <Link to={profile.profileId ? `${path}?edit=${encodeURIComponent(profile.profileId)}` : path} className="mt-4 block">
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            )}
            {variant === "compact" && (
              <div className="mt-3 flex items-center justify-between pt-3 border-t border-border">
                <span className="text-sm font-medium text-foreground">View Details</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            )}
          </>
        )}
        {mode === "marketplace" && (
          <p className="mt-3 text-[11px] text-muted-foreground pt-3 border-t border-border">
            Contact details are hidden. Review this profile and continue via the in-app flow to connect.
          </p>
        )}
      </div>
    </>
  );

  const wrapperClass =
    "bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-shadow";

  if (variant === "compact" && mode === "dashboard") {
    return (
      <Link to="/builder/my-projects">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="group"
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
