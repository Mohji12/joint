import { BuilderPortfolioPayloadRows } from "@/components/BuilderPortfolioPayloadView";
import { ContractConstructionPricingSection } from "@/components/builder/ContractConstructionPricingView";

export function normalizeFormPayload(payload: unknown): unknown {
  if (payload === null || payload === undefined) return null;
  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      return payload;
    }
  }
  return payload;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isContractConstructionForm(formType?: string): boolean {
  const form = (formType ?? "").toLowerCase().replaceAll("_", "-");
  return form === "contract-construction";
}

export function FormSubmissionPayloadView({
  payload,
  formType,
}: {
  payload: unknown;
  formType?: string;
}) {
  const normalized = normalizeFormPayload(payload);

  if (normalized === null || normalized === undefined) {
    return <p className="text-sm text-muted-foreground">No payload data</p>;
  }

  if (isContractConstructionForm(formType) && isRecord(normalized)) {
    const { pricing, ...rest } = normalized;
    const hasPricing =
      isRecord(pricing) && Object.keys(pricing).length > 0;
    const hasRest = Object.keys(rest).length > 0;

    if (!hasPricing && !hasRest) {
      return <p className="text-sm text-muted-foreground">No payload data</p>;
    }

    return (
      <div className="space-y-6">
        {hasRest ? <BuilderPortfolioPayloadRows value={rest} /> : null}
        {hasPricing ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pricing packages
            </p>
            <ContractConstructionPricingSection pricing={pricing} />
          </div>
        ) : null}
      </div>
    );
  }

  return <BuilderPortfolioPayloadRows value={normalized} />;
}
