import { useEffect, useState } from "react";
import { Loader2, Receipt } from "lucide-react";
import {
  getMyTransactions,
  type ApiTransactionStatus,
  type ApiTransactionType,
  type PaymentTransaction,
} from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const TYPE_LABELS: Record<ApiTransactionType, string> = {
  PID_VERIFICATION: "PID verification",
  FEASIBILITY_UNLOCK: "Feasibility unlock",
  PRIORITY_LISTING: "Priority listing",
  LANDOWNER_ENTRY: "Landowner entry",
  BUILDER_ENTRY_INTERIORS: "Builder entry (interiors)",
  BUILDER_ENTRY_RECONSTRUCTION: "Builder entry (renovation/repaint)",
  BUILDER_ENTRY_CONSTRUCTION: "Builder entry (construction)",
  BUILDER_ENTRY_JD: "Builder entry (JD)",
  SUCCESS_FEE_BUILDER: "Success fee (builder)",
  SUCCESS_FEE_LANDOWNER: "Success fee (landowner)",
  BUILDER_MATCH_SELECTION: "Match selection (contact unlock)",
};

const STATUS_LABELS: Record<ApiTransactionStatus, string> = {
  PENDING: "Pending",
  SUCCESS: "Success",
  FAILED: "Failed",
};

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AccountPaymentsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const landownerEntryTxns = rows.filter((t) => t.transaction_type === "LANDOWNER_ENTRY");
  const landownerEntryPaid = landownerEntryTxns.some((t) => t.status === "SUCCESS");
  const landownerEntryPending = !landownerEntryPaid && landownerEntryTxns.some((t) => t.status === "PENDING");
  const showLandownerEntryBanner = user?.userType === "landowner";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getMyTransactions();
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load transactions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading payments…
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="space-y-4">
        {showLandownerEntryBanner && (
          <Card className={cn("border", landownerEntryPaid ? "border-emerald-300 bg-emerald-50/60" : "border-amber-300 bg-amber-50/60")}>
            <CardContent className="py-4 text-sm">
              <span className="font-medium">Landowner entry fee:</span>{" "}
              {landownerEntryPaid ? "Paid" : landownerEntryPending ? "Pending" : "Unpaid"}
            </CardContent>
          </Card>
        )}
        <Card className="border-dashed border-border">
          <CardContent className="flex flex-col items-center text-center py-14 px-6">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Receipt className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <CardTitle className="text-lg">No transactions yet</CardTitle>
            <CardDescription className="mt-2 max-w-md">
              When you complete payments on Jointlly (fees, match selection, etc.), they will appear here with
              full details.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showLandownerEntryBanner && (
        <Card className={cn("border", landownerEntryPaid ? "border-emerald-300 bg-emerald-50/60" : "border-amber-300 bg-amber-50/60")}>
          <CardContent className="py-4 text-sm">
            <span className="font-medium">Landowner entry fee:</span>{" "}
            {landownerEntryPaid ? "Paid" : landownerEntryPending ? "Pending" : "Unpaid"}
          </CardContent>
        </Card>
      )}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Your payments</CardTitle>
          <CardDescription>All transactions on your account, newest first.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Payment ref</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="border-b border-border/60 last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatDate(t.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-[200px]">
                      {TYPE_LABELS[t.transaction_type] ?? t.transaction_type}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{formatMoney(t.amount, t.currency)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          t.status === "SUCCESS" && "bg-emerald-500/15 text-emerald-800",
                          t.status === "PENDING" && "bg-amber-500/15 text-amber-900",
                          t.status === "FAILED" && "bg-destructive/10 text-destructive"
                        )}
                      >
                        {STATUS_LABELS[t.status] ?? t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground font-mono text-xs">
                      {t.razorpay_payment_id || t.razorpay_order_id || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
