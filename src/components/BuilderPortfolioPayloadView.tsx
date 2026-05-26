import type { BuilderPortfolioLatest } from "@/lib/api";

export function formatPortfolioValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return v;
  return JSON.stringify(v);
}

/** "5,000 25,000 sft" → "5,000 - 25,000 sft" (two numeric tokens separated by space). */
function formatTypicalSizeRange(s: string): string {
  const t = s.trim();
  const m = t.match(/^([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)(\s+.+)?$/);
  if (!m) return s;
  const rest = (m[3] ?? "").trim();
  return rest ? `${m[1]} - ${m[2]} ${rest}` : `${m[1]} - ${m[2]}`;
}

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Cloudinary and common file extensions — paths often omit an extension. */
export function isLikelyImageUrl(s: string): boolean {
  if (!isHttpUrl(s)) return false;
  const lower = s.toLowerCase();
  if (lower.includes("res.cloudinary.com") && lower.includes("/image/upload/")) return true;
  if (/\.(jpe?g|png|gif|webp|svg|avif|bmp)(\?|#|$)/i.test(s)) return true;
  return false;
}

function isLikelyVideoUrl(s: string): boolean {
  if (!isHttpUrl(s)) return false;
  const lower = s.toLowerCase();
  if (lower.includes("res.cloudinary.com") && lower.includes("/video/upload/")) return true;
  if (/\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(s)) return true;
  return false;
}

function PortfolioMediaPreview({ value }: { value: string }) {
  if (isLikelyImageUrl(value)) {
    return (
      <div className="space-y-1">
        <img
          src={value}
          alt=""
          className="max-h-52 max-w-full rounded-md border border-[#e7e3d9] bg-[#fafafa] object-contain"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs font-medium text-[#1f4a36] underline-offset-2 hover:underline"
        >
          Open original
        </a>
      </div>
    );
  }
  if (isLikelyVideoUrl(value)) {
    return (
      <video
        src={value}
        controls
        className="max-h-64 max-w-full rounded-md border border-[#e7e3d9] bg-black"
        preload="metadata"
      />
    );
  }
  return null;
}

function PortfolioPrimitiveBlock({ value, parentKey }: { value: unknown; parentKey: string }) {
  if (typeof value === "string" && value && (isLikelyImageUrl(value) || isLikelyVideoUrl(value))) {
    const media = <PortfolioMediaPreview value={value} />;
    if (media) {
      return (
        <div className="text-sm text-[#1a2e22]">
          {parentKey ? (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#5c6b5f]">{parentKey}</p>
          ) : null}
          {media}
        </div>
      );
    }
  }

  return (
    <div className="text-sm text-[#1a2e22]">
      <span className="font-semibold text-[#5c6b5f]">{parentKey || "Value"}: </span>
      {formatPortfolioValue(value)}
    </div>
  );
}

function isArrayOfImageUrls(arr: unknown[]): arr is string[] {
  return arr.length > 0 && arr.every((x) => typeof x === "string" && x && isLikelyImageUrl(x));
}

export function BuilderPortfolioPayloadRows({
  value,
  parentKey = "",
}: {
  value: unknown;
  parentKey?: string;
}) {
  if (value === null || value === undefined) {
    return (
      <div className="text-sm text-[#1a2e22]">
        <span className="font-semibold text-[#5c6b5f]">{parentKey || "Value"}: </span>
        —
      </div>
    );
  }

  if (typeof value !== "object") {
    return <PortfolioPrimitiveBlock value={value} parentKey={parentKey || "Value"} />;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <p className="text-sm text-[#5c6b5f]">—</p>;
    }

    if (isArrayOfImageUrls(value)) {
      return (
        <div className="space-y-2">
          {parentKey ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-[#5c6b5f]">{parentKey}</p>
          ) : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {value.map((url, idx) => (
              <div
                key={`${url.slice(0, 48)}-${idx}`}
                className="overflow-hidden rounded-md border border-[#e7e3d9] bg-[#fafafa] p-2"
              >
                <img
                  src={url}
                  alt=""
                  className="mx-auto max-h-48 w-full object-contain"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block truncate text-center text-[10px] font-medium text-[#1f4a36] underline-offset-2 hover:underline"
                >
                  Open
                </a>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {value.map((item, idx) => (
          <div key={`${parentKey}-${idx}`} className="rounded-md border border-[#e7e3d9] bg-white px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#5c6b5f]">
              {parentKey || "Item"} {idx + 1}
            </p>
            <div className="mt-1">
              <BuilderPortfolioPayloadRows value={item} parentKey="" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const entries = Object.entries(value as Record<string, unknown>);
  return (
    <div className="space-y-2">
      {entries.length === 0 ? (
        <p className="text-sm text-[#5c6b5f]">—</p>
      ) : (
        entries.map(([key, val]) => {
          const label = key.replaceAll("_", " ");
          const isNested = val && typeof val === "object";
          return (
            <div key={`${parentKey}${key}`} className="rounded-md border border-[#e7e3d9] bg-white px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#5c6b5f]">{label}</p>
              <div className="mt-1">
                {isNested ? (
                  <BuilderPortfolioPayloadRows value={val} parentKey="" />
                ) : typeof val === "string" && val && (isLikelyImageUrl(val) || isLikelyVideoUrl(val)) ? (
                  <PortfolioMediaPreview value={val} />
                ) : (
                  <p className="text-sm text-[#1a2e22]">
                    {key === "typical_size" && typeof val === "string"
                      ? formatTypicalSizeRange(val)
                      : formatPortfolioValue(val)}
                  </p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export type BuilderPortfolioSubmission = BuilderPortfolioLatest["contract_construction"];

/** True when there is no usable registration payload (empty object or only empty/null/array values). */
function isSubmissionPayloadMissing(payload: unknown): boolean {
  if (payload === undefined || payload === null) return true;
  if (typeof payload !== "object" || Array.isArray(payload)) return false;
  const record = payload as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length === 0) return true;
  return keys.every((k) => {
    const v = record[k];
    if (v === undefined || v === null || v === "") return true;
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === "object" && !Array.isArray(v)) return isSubmissionPayloadMissing(v);
    return false;
  });
}

export function BuilderPortfolioTypePanel({
  title,
  submission,
}: {
  title: string;
  submission: BuilderPortfolioSubmission | null;
}) {
  const missing =
    !submission || isSubmissionPayloadMissing(submission.payload);

  if (missing) {
    return (
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-6 text-sm text-[#3d3a33]">
        <p className="font-semibold text-[#1a2e22]">No details for this construction type</p>
        <p className="mt-2 leading-relaxed text-[#5c6b5f]">
          This builder has not provided or has not updated their registration for{" "}
          <span className="font-medium text-[#1a2e22]">{title}</span> yet. The marketplace card may still show a short
          summary from another source; full registration for this type will appear here once they complete or refresh it.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[#e7e3d9] bg-[#f8f7f3] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#5c6b5f]">Last updated</p>
        <p className="mt-1 text-sm font-medium text-[#1a2e22]">{new Date(submission.created_at).toLocaleString()}</p>
      </div>
      <BuilderPortfolioPayloadRows value={submission.payload} />
    </div>
  );
}
