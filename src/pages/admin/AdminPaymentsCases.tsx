import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listAdminTransactions, updateAdminTransaction, type AdminTransactionListItem } from "@/lib/api";

export default function AdminPaymentsCases() {
  const [rows, setRows] = useState<AdminTransactionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string>("");
  const [status, setStatus] = useState<string>("ALL");
  const [type, setType] = useState<string>("");
  const [q, setQ] = useState<string>("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminTransactionListItem | null>(null);
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listAdminTransactions({
          limit: 200,
          user_id: userId || undefined,
          status: status === "ALL" ? undefined : status,
          type: type || undefined,
          q: q || undefined,
        });
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
  }, [userId, status, type, q]);

  useEffect(() => {
    if (!selectedId) return;
    const tx = rows.find((r) => r.id === selectedId) || null;
    setSelected(tx);
    setNotes(tx?.admin_notes ?? "");
  }, [selectedId, rows]);

  const resolutionCounts = useMemo(() => {
    const map: Record<string, number> = {};
    rows.forEach((r) => {
      const key = r.admin_resolution_status || "(none)";
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [rows]);

  const save = async (patch: { admin_resolution_status?: "OPEN" | "INVESTIGATING" | "RESOLVED"; admin_notes?: string | null }) => {
    if (!selected) return;
    const updated = await updateAdminTransaction(selected.id, patch);
    setSelected(updated);
    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payments cases</h1>
        <p className="text-muted-foreground mt-1">
          Admin resolution layer for payment/refund issues (does not trigger Razorpay refunds).
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-lg">Filters</CardTitle>
          <div className="text-xs text-muted-foreground">
            {Object.entries(resolutionCounts)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([k, v]) => `${k}:${v}`)
              .join(" · ")}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User id" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order_id/payment_id" />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="PENDING">PENDING</SelectItem>
              <SelectItem value="SUCCESS">SUCCESS</SelectItem>
              <SelectItem value="FAILED">FAILED</SelectItem>
            </SelectContent>
          </Select>
          <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="Transaction type" />
        </CardContent>
      </Card>

      {loading && <div className="text-sm text-muted-foreground">Loading transactions...</div>}
      {error && <div className="text-sm text-destructive">{error}</div>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr className="text-left">
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Order/Payment</th>
                <th className="px-3 py-2">Resolution</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{r.transaction_type}</td>
                  <td className="px-3 py-2">
                    {r.amount} {r.currency}
                  </td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground break-words">
                    {r.razorpay_order_id || "-"}
                    <div>{r.razorpay_payment_id || "-"}</div>
                  </td>
                  <td className="px-3 py-2">{r.admin_resolution_status || "-"}</td>
                  <td className="px-3 py-2 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setSelectedId(r.id)}>
                      Open
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-3 py-8 text-center text-muted-foreground" colSpan={7}>
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
            setSelected(null);
            setNotes("");
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Transaction</DialogTitle>
          </DialogHeader>
          {!selected ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm">
                <div className="font-medium">{selected.transaction_type}</div>
                <div className="text-xs text-muted-foreground">
                  {selected.id} · {selected.status} · {selected.amount} {selected.currency}
                </div>
              </div>

              <div className="text-xs text-muted-foreground break-words">
                Order: {selected.razorpay_order_id || "-"} · Payment: {selected.razorpay_payment_id || "-"}
              </div>

              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Admin notes" />

              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="secondary" onClick={() => void save({ admin_resolution_status: "OPEN" })}>
                  Open
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void save({ admin_resolution_status: "INVESTIGATING" })}>
                  Investigating
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void save({ admin_resolution_status: "RESOLVED" })}>
                  Resolved
                </Button>
                <Button size="sm" onClick={() => void save({ admin_notes: notes })}>
                  Save notes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

