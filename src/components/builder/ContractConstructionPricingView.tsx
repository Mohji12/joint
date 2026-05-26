import { cn } from "@/lib/utils";
import {
  RESIDENTIAL_PACKAGES,
  COMMERCIAL_PACKAGES,
  INDUSTRIAL_PACKAGES,
  type PackageSpec,
} from "@/data/constructionPricingSpecs";

const formatKey = (value: string) =>
  value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());

const RESIDENTIAL_COLUMN_ORDER = ["basic", "premium", "standard"] as const;
const COMMERCIAL_COLUMN_ORDER = ["value", "corporate", "signature"] as const;
const INDUSTRIAL_COLUMN_ORDER = ["utility", "manufacturing", "hitech"] as const;

function normalizePricingCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

function isPackageTierPricing(
  value: unknown,
  allowedPackageIds: readonly string[]
): value is Record<string, Record<string, string>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length === 0) return false;
  if (!keys.some((k) => allowedPackageIds.includes(k))) return false;
  for (const row of Object.values(obj)) {
    if (!row || typeof row !== "object" || Array.isArray(row)) return false;
    for (const cell of Object.values(row as Record<string, unknown>)) {
      if (cell !== null && typeof cell === "object") return false;
    }
  }
  return true;
}

function PricingComparisonTable({
  segmentTitle,
  packages,
  columnOrder,
  data,
}: {
  segmentTitle: string;
  packages: PackageSpec[];
  columnOrder: readonly string[];
  data: Record<string, Record<string, string>>;
}) {
  const specById = new Map(packages.map((p) => [p.id, p]));
  const orderedSpecs = columnOrder.map((id) => specById.get(id)).filter((p): p is PackageSpec => Boolean(p));
  if (orderedSpecs.length === 0) return null;

  const fields = orderedSpecs[0].fields;

  const cell = (packageId: string, key: string) => {
    const raw = data[packageId]?.[key];
    const s = normalizePricingCell(raw).trim();
    return s || "—";
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#e7e3d9] bg-white shadow-sm">
      <div className="border-b border-[#e7e3d9] bg-[#f6f3ee] px-4 py-2.5">
        <h4 className="text-sm font-bold uppercase tracking-wide text-[#1a2e22]">{segmentTitle}</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-[#1f4a36] to-[#2e6247] text-left text-white">
              <th
                scope="col"
                className="sticky left-0 z-10 border-b border-r border-white/15 bg-[#1f4a36] px-4 py-3 font-semibold"
              >
                Specification
              </th>
              {orderedSpecs.map((p) => (
                <th
                  key={p.id}
                  scope="col"
                  className="border-b border-l border-white/15 px-4 py-3 font-semibold whitespace-nowrap"
                >
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-[#27342b]">
            {fields.map((field, rowIndex) => {
              const rowBg = rowIndex % 2 === 0 ? "bg-white" : "bg-[#faf8f4]/90";
              return (
                <tr key={field.key} className={rowBg}>
                  <th
                    scope="row"
                    className={cn(
                      "sticky left-0 z-[1] border-b border-r border-[#e7e3d9] px-4 py-2.5 text-left text-xs font-semibold text-[#2a3e30] sm:text-sm",
                      rowBg
                    )}
                  >
                    {field.label}
                  </th>
                  {orderedSpecs.map((p) => (
                    <td key={p.id} className="border-b border-l border-[#e7e3d9] px-4 py-2.5 align-top break-words">
                      {cell(p.id, field.key)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PricingBlock({ label, value, depth = 0 }: { label: string; value: unknown; depth?: number }) {
  if (value === null || value === undefined) return null;
  if (typeof value === "object" && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return null;
    return (
      <div className={cn("space-y-2", depth > 0 && "mt-2 border-l-2 border-[#c8a15a]/40 pl-3")}>
        <p className={cn("text-xs font-semibold uppercase tracking-wide text-[#2a3e30]", depth === 0 && "text-sm")}>
          {formatKey(label)}
        </p>
        <div className="space-y-2">
          {entries.map(([k, v]) => (
            <PricingBlock key={k} label={k} value={v} depth={depth + 1} />
          ))}
        </div>
      </div>
    );
  }
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <span className="text-xs font-semibold text-[#2a3e30]">{formatKey(label)}:</span>
        {value.length === 0 ? (
          <span className="text-xs text-[#5c6b5f]">—</span>
        ) : (
          value.map((item, i) => (
            <span
              key={i}
              className="rounded-md bg-white/80 px-2 py-0.5 text-xs font-medium text-[#27342b] shadow-sm ring-1 ring-[#e7e3d9]"
            >
              {String(item)}
            </span>
          ))
        )}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 text-sm sm:grid-cols-[140px_1fr]">
      <span className="text-xs font-semibold text-[#5c6b5f] sm:text-sm">{formatKey(label)}</span>
      <span className="break-words font-medium text-[#1a2e22]">{String(value)}</span>
    </div>
  );
}

function PricingSegmentBlock({ segment, details }: { segment: string; details: unknown }) {
  if (segment === "residential" && isPackageTierPricing(details, RESIDENTIAL_COLUMN_ORDER)) {
    return (
      <PricingComparisonTable
        segmentTitle="Residential"
        packages={RESIDENTIAL_PACKAGES}
        columnOrder={RESIDENTIAL_COLUMN_ORDER}
        data={details}
      />
    );
  }
  if (segment === "commercial" && isPackageTierPricing(details, COMMERCIAL_COLUMN_ORDER)) {
    return (
      <PricingComparisonTable
        segmentTitle="Commercial"
        packages={COMMERCIAL_PACKAGES}
        columnOrder={COMMERCIAL_COLUMN_ORDER}
        data={details}
      />
    );
  }
  if (segment === "industrial" && isPackageTierPricing(details, INDUSTRIAL_COLUMN_ORDER)) {
    return (
      <PricingComparisonTable
        segmentTitle="Industrial"
        packages={INDUSTRIAL_PACKAGES}
        columnOrder={INDUSTRIAL_COLUMN_ORDER}
        data={details}
      />
    );
  }
  return (
    <div className="rounded-xl border border-[#e7e3d9] bg-white/80 p-4">
      <PricingBlock label={segment} value={details} />
    </div>
  );
}

export function ContractConstructionPricingSection({
  pricing,
}: {
  pricing: Record<string, unknown>;
}) {
  const entries = Object.entries(pricing);
  if (entries.length === 0) return null;

  return (
    <div className="space-y-6">
      {entries.map(([segment, details]) => (
        <PricingSegmentBlock key={segment} segment={segment} details={details} />
      ))}
    </div>
  );
}
