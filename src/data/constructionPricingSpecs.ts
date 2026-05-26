/**
 * Construction pricing spec definitions for Indicative Pricing (Contract Construction & JV/JD forms).
 * Three types: Residential (Contract), Commercial, Industrial   each with package rows and field definitions.
 */

export type ConstructionPricingType = "residential" | "commercial" | "industrial";

/** One package row for Residential (Contract) */
export interface ResidentialPackageRow {
  id: "basic" | "standard" | "premium";
  label: string;
  selected: boolean;
  rate_per_sft: string;
  steel_brand: string;
  cement_brand: string;
  flooring_material: string;
  sanitary_fittings_brand: string;
  electrical_wire_brand: string;
  electrical_switch_brand: string;
  door_frame_shutter: string;
  windows_upvc: string;
  paint_internal_external: string;
}

/** One package row for Commercial */
export interface CommercialPackageRow {
  id: "value" | "corporate" | "signature";
  label: string;
  selected: boolean;
  rate_per_sft: string;
  rcc_structural_grade: string;
  steel_corrosion_resistance: string;
  flooring_type: string;
  facade_glazing: string;
  electrical_load_capacity: string;
  fire_safety_system: string;
  elevators_lifts: string;
  hvac_cooling: string;
  plumbing_stp: string;
  paint_cladding: string;
}

/** One package row for Industrial */
export interface IndustrialPackageRow {
  id: "utility" | "manufacturing" | "hitech";
  label: string;
  selected: boolean;
  rate_per_sft: string;
  structure_type: string;
  bay_spacing: string;
  flooring_load_capacity: string;
  roofing_cladding_type: string;
  clear_height: string;
  eot_crane_provision: string;
  fire_suppression_system: string;
  ventilation_system: string;
  power_load_kva: string;
}

export type ResidentialPackageId = ResidentialPackageRow["id"];
export type CommercialPackageId = CommercialPackageRow["id"];
export type IndustrialPackageId = IndustrialPackageRow["id"];

/** Field definition for table column (key + label) */
export interface PricingFieldSpec {
  key: string;
  label: string;
}

/** Package row config: id, label, and field keys in order */
export interface PackageSpec {
  id: string;
  label: string;
  fields: PricingFieldSpec[];
}

export const RESIDENTIAL_PACKAGES: PackageSpec[] = [
  { id: "basic", label: "Basic", fields: [
    { key: "rate_per_sft", label: "Rate (₹/sft)" },
    { key: "steel_brand", label: "Steel brand" },
    { key: "cement_brand", label: "Cement brand" },
    { key: "flooring_material", label: "Flooring material" },
    { key: "sanitary_fittings_brand", label: "Sanitary fittings brand" },
    { key: "electrical_wire_brand", label: "Electrical wire brand" },
    { key: "electrical_switch_brand", label: "Electrical switch brand" },
    { key: "door_frame_shutter", label: "Door frame / shutter" },
    { key: "windows_upvc", label: "Windows / UPVC" },
    { key: "paint_internal_external", label: "Paint (internal / external)" },
  ]},
  { id: "standard", label: "Standard", fields: [
    { key: "rate_per_sft", label: "Rate (₹/sft)" },
    { key: "steel_brand", label: "Steel brand" },
    { key: "cement_brand", label: "Cement brand" },
    { key: "flooring_material", label: "Flooring material" },
    { key: "sanitary_fittings_brand", label: "Sanitary fittings brand" },
    { key: "electrical_wire_brand", label: "Electrical wire brand" },
    { key: "electrical_switch_brand", label: "Electrical switch brand" },
    { key: "door_frame_shutter", label: "Door frame / shutter" },
    { key: "windows_upvc", label: "Windows / UPVC" },
    { key: "paint_internal_external", label: "Paint (internal / external)" },
  ]},
  { id: "premium", label: "Premium (Luxury)", fields: [
    { key: "rate_per_sft", label: "Rate (₹/sft)" },
    { key: "steel_brand", label: "Steel brand" },
    { key: "cement_brand", label: "Cement brand" },
    { key: "flooring_material", label: "Flooring material" },
    { key: "sanitary_fittings_brand", label: "Sanitary fittings brand" },
    { key: "electrical_wire_brand", label: "Electrical wire brand" },
    { key: "electrical_switch_brand", label: "Electrical switch brand" },
    { key: "door_frame_shutter", label: "Door frame / shutter" },
    { key: "windows_upvc", label: "Windows / UPVC" },
    { key: "paint_internal_external", label: "Paint (internal / external)" },
  ]},
];

export const COMMERCIAL_PACKAGES: PackageSpec[] = [
  { id: "value", label: "Value (Retail / Warehouse)", fields: [
    { key: "rate_per_sft", label: "Rate (₹/sft)" },
    { key: "rcc_structural_grade", label: "RCC structural grade" },
    { key: "steel_corrosion_resistance", label: "Steel corrosion resistance" },
    { key: "flooring_type", label: "Flooring type" },
    { key: "facade_glazing", label: "Facade & glazing" },
    { key: "electrical_load_capacity", label: "Electrical load capacity" },
    { key: "fire_safety_system", label: "Fire safety system" },
    { key: "elevators_lifts", label: "Elevators / lifts" },
    { key: "hvac_cooling", label: "HVAC / cooling" },
    { key: "plumbing_stp", label: "Plumbing / STP" },
    { key: "paint_cladding", label: "Paint & cladding" },
  ]},
  { id: "corporate", label: "Corporate (Offices / IT)", fields: [
    { key: "rate_per_sft", label: "Rate (₹/sft)" },
    { key: "rcc_structural_grade", label: "RCC structural grade" },
    { key: "steel_corrosion_resistance", label: "Steel corrosion resistance" },
    { key: "flooring_type", label: "Flooring type" },
    { key: "facade_glazing", label: "Facade & glazing" },
    { key: "electrical_load_capacity", label: "Electrical load capacity" },
    { key: "fire_safety_system", label: "Fire safety system" },
    { key: "elevators_lifts", label: "Elevators / lifts" },
    { key: "hvac_cooling", label: "HVAC / cooling" },
    { key: "plumbing_stp", label: "Plumbing / STP" },
    { key: "paint_cladding", label: "Paint & cladding" },
  ]},
  { id: "signature", label: "Signature (Boutique / Hotels)", fields: [
    { key: "rate_per_sft", label: "Rate (₹/sft)" },
    { key: "rcc_structural_grade", label: "RCC structural grade" },
    { key: "steel_corrosion_resistance", label: "Steel corrosion resistance" },
    { key: "flooring_type", label: "Flooring type" },
    { key: "facade_glazing", label: "Facade & glazing" },
    { key: "electrical_load_capacity", label: "Electrical load capacity" },
    { key: "fire_safety_system", label: "Fire safety system" },
    { key: "elevators_lifts", label: "Elevators / lifts" },
    { key: "hvac_cooling", label: "HVAC / cooling" },
    { key: "plumbing_stp", label: "Plumbing / STP" },
    { key: "paint_cladding", label: "Paint & cladding" },
  ]},
];

export const INDUSTRIAL_PACKAGES: PackageSpec[] = [
  { id: "utility", label: "Utility (Warehouse / Shed)", fields: [
    { key: "rate_per_sft", label: "Rate (₹/sft)" },
    { key: "structure_type", label: "Structure type" },
    { key: "bay_spacing", label: "Bay spacing" },
    { key: "flooring_load_capacity", label: "Flooring load capacity" },
    { key: "roofing_cladding_type", label: "Roofing / cladding type" },
    { key: "clear_height", label: "Clear height" },
    { key: "eot_crane_provision", label: "EOT crane provision" },
    { key: "fire_suppression_system", label: "Fire suppression system" },
    { key: "ventilation_system", label: "Ventilation system" },
    { key: "power_load_kva", label: "Power load (KVA)" },
  ]},
  { id: "manufacturing", label: "Manufacturing (Factory)", fields: [
    { key: "rate_per_sft", label: "Rate (₹/sft)" },
    { key: "structure_type", label: "Structure type" },
    { key: "bay_spacing", label: "Bay spacing" },
    { key: "flooring_load_capacity", label: "Flooring load capacity" },
    { key: "roofing_cladding_type", label: "Roofing / cladding type" },
    { key: "clear_height", label: "Clear height" },
    { key: "eot_crane_provision", label: "EOT crane provision" },
    { key: "fire_suppression_system", label: "Fire suppression system" },
    { key: "ventilation_system", label: "Ventilation system" },
    { key: "power_load_kva", label: "Power load (KVA)" },
  ]},
  { id: "hitech", label: "Hi-Tech (Data Center / Pharma)", fields: [
    { key: "rate_per_sft", label: "Rate (₹/sft)" },
    { key: "structure_type", label: "Structure type" },
    { key: "bay_spacing", label: "Bay spacing" },
    { key: "flooring_load_capacity", label: "Flooring load capacity" },
    { key: "roofing_cladding_type", label: "Roofing / cladding type" },
    { key: "clear_height", label: "Clear height" },
    { key: "eot_crane_provision", label: "EOT crane provision" },
    { key: "fire_suppression_system", label: "Fire suppression system" },
    { key: "ventilation_system", label: "Ventilation system" },
    { key: "power_load_kva", label: "Power load (KVA)" },
  ]},
];

/** Default row values (all empty) for residential */
function emptyResidentialRow(id: ResidentialPackageId, label: string): ResidentialPackageRow {
  return {
    id,
    label,
    selected: false,
    rate_per_sft: "",
    steel_brand: "",
    cement_brand: "",
    flooring_material: "",
    sanitary_fittings_brand: "",
    electrical_wire_brand: "",
    electrical_switch_brand: "",
    door_frame_shutter: "",
    windows_upvc: "",
    paint_internal_external: "",
  };
}

/** Default row values for commercial */
function emptyCommercialRow(id: CommercialPackageId, label: string): CommercialPackageRow {
  return {
    id,
    label,
    selected: false,
    rate_per_sft: "",
    rcc_structural_grade: "",
    steel_corrosion_resistance: "",
    flooring_type: "",
    facade_glazing: "",
    electrical_load_capacity: "",
    fire_safety_system: "",
    elevators_lifts: "",
    hvac_cooling: "",
    plumbing_stp: "",
    paint_cladding: "",
  };
}

/** Default row values for industrial */
function emptyIndustrialRow(id: IndustrialPackageId, label: string): IndustrialPackageRow {
  return {
    id,
    label,
    selected: false,
    rate_per_sft: "",
    structure_type: "",
    bay_spacing: "",
    flooring_load_capacity: "",
    roofing_cladding_type: "",
    clear_height: "",
    eot_crane_provision: "",
    fire_suppression_system: "",
    ventilation_system: "",
    power_load_kva: "",
  };
}

export function getDefaultResidentialPackages(): ResidentialPackageRow[] {
  return RESIDENTIAL_PACKAGES.map((p) => emptyResidentialRow(p.id as ResidentialPackageId, p.label));
}

export function getDefaultCommercialPackages(): CommercialPackageRow[] {
  return COMMERCIAL_PACKAGES.map((p) => emptyCommercialRow(p.id as CommercialPackageId, p.label));
}

export function getDefaultIndustrialPackages(): IndustrialPackageRow[] {
  return INDUSTRIAL_PACKAGES.map((p) => emptyIndustrialRow(p.id as IndustrialPackageId, p.label));
}

/** Payload shape sent to API (nested by type, then by package id) */
export interface ConstructionPricingPayload {
  residential?: Record<string, Record<string, string>>;
  commercial?: Record<string, Record<string, string>>;
  industrial?: Record<string, Record<string, string>>;
}

export function buildPricingPayload(
  residential: ResidentialPackageRow[],
  commercial: CommercialPackageRow[],
  industrial: IndustrialPackageRow[]
): ConstructionPricingPayload {
  const payload: ConstructionPricingPayload = {};
  const toRowPayload = (row: Record<string, unknown>, excludeKeys: string[]) => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      if (excludeKeys.includes(k)) continue;
      out[k] = typeof v === "string" ? v : "";
    }
    return out;
  };
  if (residential.some((r) => r.selected || r.rate_per_sft)) {
    payload.residential = {};
    residential.forEach((r) => {
      payload.residential![r.id] = toRowPayload(r, ["id", "label", "selected"]);
    });
  }
  if (commercial.some((r) => r.selected || r.rate_per_sft)) {
    payload.commercial = {};
    commercial.forEach((r) => {
      payload.commercial![r.id] = toRowPayload(r, ["id", "label", "selected"]);
    });
  }
  if (industrial.some((r) => r.selected || r.rate_per_sft)) {
    payload.industrial = {};
    industrial.forEach((r) => {
      payload.industrial![r.id] = toRowPayload(r, ["id", "label", "selected"]);
    });
  }
  return payload;
}
