import { cn } from "@/lib/utils";
import { PastProjectShowcaseCard } from "./PastProjectShowcaseCard";
import {
  avatarTone,
  companyInitials,
  type BuilderComparisonColumnData,
} from "./builderComparisonUtils";

type BuilderComparisonTableProps = {
  columns: BuilderComparisonColumnData[];
  className?: string;
  /** Row label column width */
  labelWidthClassName?: string;
};

function MetricInsight({
  label,
  columns,
  pick,
}: {
  label: string;
  columns: BuilderComparisonColumnData[];
  pick: (col: BuilderComparisonColumnData) => number | null;
}) {
  const values = columns.map(pick);
  const numeric = values.filter((v): v is number => v != null);
  const best = numeric.length >= 2 ? Math.min(...numeric) : null;

  return (
    <tr className="border-b border-[#eef0f3] last:border-b-0">
      <th
        scope="row"
        className="bg-[#fafafa] px-4 py-4 text-left text-sm font-medium text-[#6b7280] align-top"
      >
        {label}
      </th>
      {columns.map((col, idx) => {
        const value = pick(col);
        const showFaster =
          label.toLowerCase().includes("delivery") &&
          best != null &&
          value != null &&
          columns.length >= 2 &&
          value === best;
        const showFewerJd =
          label.toLowerCase().includes("delivered") &&
          columns.length >= 2 &&
          value != null &&
          numeric.length >= 2 &&
          value === Math.min(...numeric);

        return (
          <td key={col.id} className="px-4 py-4 align-top text-center">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-2xl font-bold text-[#111827]">{value ?? "—"}</span>
              {showFaster ? (
                <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[10px] font-semibold text-[#166534]">
                  Faster
                </span>
              ) : null}
              {showFewerJd && !showFaster ? (
                <span className="rounded-full bg-[#ffedd5] px-2 py-0.5 text-[10px] font-semibold text-[#c2410c]">
                  Fewer JD deals
                </span>
              ) : null}
            </div>
          </td>
        );
      })}
    </tr>
  );
}

function ColumnHeader({ column, index }: { column: BuilderComparisonColumnData; index: number }) {
  const tone = avatarTone(index);
  const initials = companyInitials(column.companyName);

  return (
    <div className="flex flex-col items-center gap-2 px-2 py-1 text-center">
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm",
          tone === "blue" ? "bg-[#2563eb]" : "bg-[#16a34a]"
        )}
      >
        {initials}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold leading-snug text-[#111827]">{column.companyName}</p>
        <p className="text-xs text-[#6b7280]">{column.locationLine}</p>
        {column.tags.length ? (
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5">
            {column.tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  /jv|jd/i.test(tag)
                    ? "bg-[#dbeafe] text-[#1d4ed8]"
                    : /interior/i.test(tag)
                      ? "bg-[#f3e8ff] text-[#7e22ce]"
                      : /renovation|repaint/i.test(tag)
                        ? "bg-[#ffedd5] text-[#c2410c]"
                        : "bg-[#dcfce7] text-[#166534]"
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function BuilderComparisonTable({
  columns,
  className,
  labelWidthClassName = "w-[140px] sm:w-[160px]",
}: BuilderComparisonTableProps) {
  if (!columns.length) return null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.06)]",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-[#eef0f3]">
              <th className={cn("bg-[#fafafa]", labelWidthClassName)} aria-hidden />
              {columns.map((col, idx) => (
                <th key={col.id} className="min-w-[220px] bg-[#fafafa] px-3 py-4 font-normal">
                  <ColumnHeader column={col} index={idx} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <MetricInsight
              label="Total delivered"
              columns={columns}
              pick={(col) => col.totalDelivered}
            />
            <MetricInsight
              label="Avg delivery (months)"
              columns={columns}
              pick={(col) => col.avgDeliveryMonths}
            />
            <tr>
              <th
                scope="row"
                className="bg-[#fafafa] px-4 py-4 text-left text-sm font-medium text-[#6b7280] align-top"
              >
                Past projects
              </th>
              {columns.map((col, colIdx) => (
                <td key={col.id} className="px-3 py-4 align-top">
                  <div className="mx-auto flex max-w-[240px] flex-col gap-2.5">
                    {col.pastProjects.length ? (
                      col.pastProjects.map((project, projectIdx) => (
                        <PastProjectShowcaseCard
                          key={`${col.id}-${projectIdx}`}
                          project={project}
                          index={projectIdx + colIdx}
                        />
                      ))
                    ) : (
                      <p className="py-6 text-center text-xs text-[#9ca3af]">No past projects added yet</p>
                    )}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
