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
import {
  listAdminSupportTickets,
  getAdminSupportTicket,
  updateAdminSupportTicket,
  type AdminSupportTicketListItem,
  type AdminSupportTicketDetail,
} from "@/lib/api";

export default function AdminSupportTickets() {
  const [rows, setRows] = useState<AdminSupportTicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<string>("ALL");
  const [userId, setUserId] = useState<string>("");
  const [q, setQ] = useState<string>("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminSupportTicketDetail | null>(null);
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listAdminSupportTickets({
          limit: 200,
          status: status === "ALL" ? undefined : status,
          user_id: userId || undefined,
          q: q || undefined,
        });
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load tickets");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, userId, q]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    (async () => {
      try {
        const detail = await getAdminSupportTicket(selectedId);
        if (cancelled) return;
        setSelected(detail);
        setNotes(detail.admin_notes ?? "");
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load ticket");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {};
    rows.forEach((r) => {
      map[r.status] = (map[r.status] || 0) + 1;
    });
    return map;
  }, [rows]);

  const save = async (patch: { status?: string; admin_notes?: string | null }) => {
    if (!selected) return;
    const updated = await updateAdminSupportTicket(selected.id, patch);
    setSelected(updated);
    setRows((prev) => prev.map((r) => (r.id === updated.id ? { ...r, status: updated.status } : r)));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Support tickets</h1>
        <p className="text-muted-foreground mt-1">Operational triage and resolution.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-lg">Filters</CardTitle>
          <div className="text-xs text-muted-foreground">
            {Object.entries(statusCounts)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([k, v]) => `${k}:${v}`)
              .join(" · ")}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="open">open</SelectItem>
              <SelectItem value="triage">triage</SelectItem>
              <SelectItem value="resolved">resolved</SelectItem>
              <SelectItem value="closed">closed</SelectItem>
            </SelectContent>
          </Select>
          <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Filter by user_id" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search subject/description" />
        </CardContent>
      </Card>

      {loading && <div className="text-sm text-muted-foreground">Loading tickets...</div>}
      {error && <div className="text-sm text-destructive">{error}</div>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr className="text-left">
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Route</th>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="px-3 py-2">{r.subject}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.route || "-"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.user_id || "-"}</td>
                  <td className="px-3 py-2 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setSelectedId(r.id)}>
                      Open
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-3 py-8 text-center text-muted-foreground" colSpan={6}>
                    No tickets found.
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
            <DialogTitle>Ticket</DialogTitle>
          </DialogHeader>
          {!selected ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm">
                <div className="font-medium">{selected.subject}</div>
                <div className="text-xs text-muted-foreground">
                  {selected.status} · {selected.route || "-"} · {selected.user_id || "-"}
                </div>
              </div>

              <div className="text-sm whitespace-pre-wrap">{selected.description}</div>

              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Admin notes" />

              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="secondary" onClick={() => void save({ status: "triage" })}>
                  Mark triage
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void save({ status: "resolved" })}>
                  Mark resolved
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

