import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { PackageSpec, ConstructionPricingType } from "@/data/constructionPricingSpecs";
import type { ResidentialPackageRow, CommercialPackageRow, IndustrialPackageRow } from "@/data/constructionPricingSpecs";

export type PricingRow = ResidentialPackageRow | CommercialPackageRow | IndustrialPackageRow;

interface ConstructionPricingTableProps {
  constructionType: ConstructionPricingType;
  packages: PackageSpec[];
  rows: PricingRow[];
  onRowsChange: (rows: PricingRow[]) => void;
}

export function ConstructionPricingTable({
  constructionType,
  packages,
  rows,
  onRowsChange,
}: ConstructionPricingTableProps) {
  const fieldSpecs = packages[0]?.fields ?? [];
  const fieldKeys = fieldSpecs.map((f) => f.key);

  const updateCell = (rowIndex: number, fieldKey: string, value: string) => {
    const next = rows.map((r, i) =>
      i === rowIndex ? { ...r, [fieldKey]: value } : r
    );
    onRowsChange(next);
  };

  const toggleSelected = (rowIndex: number) => {
    const next = rows.map((r, i) =>
      i === rowIndex ? { ...r, selected: !r.selected } : r
    );
    onRowsChange(next);
  };

  const getPlaceholder = (fieldKey: string): string => {
    // Common numeric/rate hints
    if (fieldKey === "rate_per_sft") return "e.g. ₹2,400 / sft";

    // Residential examples
    if (fieldKey === "steel_brand") return "e.g. Tata Tiscon";
    if (fieldKey === "cement_brand") return "e.g. UltraTech";
    if (fieldKey === "flooring_material") return "e.g. Kajaria vitrified tiles";
    if (fieldKey === "sanitary_fittings_brand") return "e.g. Jaquar";
    if (fieldKey === "electrical_wire_brand") return "e.g. Polycab";
    if (fieldKey === "electrical_switch_brand") return "e.g. Legrand";
    if (fieldKey === "door_frame_shutter") return "e.g. CenturyPly flush door";
    if (fieldKey === "windows_upvc") return "e.g. Fenesta uPVC";
    if (fieldKey === "paint_internal_external") return "e.g. Asian Paints Apex + Royale";

    // Commercial examples
    if (fieldKey === "rcc_structural_grade") return "e.g. M30 / M35";
    if (fieldKey === "steel_corrosion_resistance") return "e.g. JSW Epoxy coated TMT";
    if (fieldKey === "flooring_type") return "e.g. Granito / anti-skid vitrified";
    if (fieldKey === "facade_glazing") return "e.g. Saint-Gobain DGU glazing";
    if (fieldKey === "electrical_load_capacity") return "e.g. 250 kVA";
    if (fieldKey === "fire_safety_system") return "e.g. Honeywell addressable system";
    if (fieldKey === "elevators_lifts") return "e.g. KONE / OTIS";
    if (fieldKey === "hvac_cooling") return "e.g. Daikin VRV";
    if (fieldKey === "plumbing_stp") return "e.g. Astral CPVC + 50 KLD STP";
    if (fieldKey === "paint_cladding") return "e.g. Berger + Aludecor ACP";

    // Industrial examples
    if (fieldKey === "structure_type") return "e.g. PEB (Kirby / Interarch)";
    if (fieldKey === "bay_spacing") return "e.g. 8m x 8m";
    if (fieldKey === "flooring_load_capacity") return "e.g. 5 ton/sqm";
    if (fieldKey === "roofing_cladding_type") return "e.g. Tata Bluescope sheeting";
    if (fieldKey === "clear_height") return "e.g. 10 m";
    if (fieldKey === "eot_crane_provision") return "e.g. 10T EOT runway";
    if (fieldKey === "fire_suppression_system") return "e.g. Sprinkler + hydrant";
    if (fieldKey === "ventilation_system") return "e.g. Ridge ventilators + louvers";
    if (fieldKey === "power_load_kva") return "e.g. 500 kVA";

    return constructionType === "residential" ? "Enter details" : "Enter spec";
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="min-w-[180px] px-3 py-2 text-left font-medium text-foreground">Spec / Package</th>
            {rows.map((row) => (
              <th key={row.id} className="min-w-[140px] px-3 py-2 text-left font-medium text-foreground">
                {row.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className="px-3 py-2 text-muted-foreground">Select</td>
            {rows.map((row, rowIndex) => (
              <td key={row.id} className="px-3 py-2">
                <Checkbox
                  checked={row.selected}
                  onCheckedChange={() => toggleSelected(rowIndex)}
                />
              </td>
            ))}
          </tr>
          {fieldSpecs.map((f) => (
            <tr key={f.key} className="border-b border-border last:border-b-0">
              <td className="px-3 py-2 font-medium text-foreground">{f.label}</td>
              {rows.map((row, rowIndex) => (
                <td key={row.id} className="px-3 py-2">
                  <Input
                    value={(row as Record<string, string>)[f.key] ?? ""}
                    onChange={(e) => updateCell(rowIndex, f.key, e.target.value)}
                    placeholder={getPlaceholder(f.key)}
                    className="h-9"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
