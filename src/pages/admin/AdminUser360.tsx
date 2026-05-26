import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormSubmissionPayloadView } from "@/components/admin/FormSubmissionPayloadView";
import { AdminFormSubmissionPayloadEditor } from "@/components/admin/AdminFormSubmissionPayloadEditor";
import {
  getAdminUser360,
  updateAdminSupportTicket,
  updateAdminTransaction,
  type AdminUser360Response,
  type AdminSupportTicketDetail,
  type AdminTransactionListItem,
  type AdminFormSubmissionListItem,
} from "@/lib/api";

function prettyLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  return String(value);
}

function renderNestedData(value: unknown, path: string): React.ReactNode {
  if (value === null || value === undefined || typeof value !== "object") {
    return <p className="text-sm text-foreground break-words">{formatValue(value)}</p>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <p className="text-sm text-muted-foreground">No items</p>;
    return (
      <div className="space-y-2">
        {value.map((item, idx) => (
          <div key={`${path}-${idx}`} className="rounded-md border bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Item {idx + 1}</p>
            {renderNestedData(item, `${path}-${idx}`)}
          </div>
        ))}
      </div>
    );
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (!entries.length) return <p className="text-sm text-muted-foreground">No fields</p>;

  return (
    <div className="space-y-2">
      {entries.map(([k, v]) => {
        const key = `${path}-${k}`;
        const nested = v !== null && typeof v === "object";
        return (
          <div key={key} className="rounded-md border p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">{prettyLabel(k)}</p>
            {nested ? renderNestedData(v, key) : <p className="text-sm text-foreground break-words">{formatValue(v)}</p>}
          </div>
        );
      })}
    </div>
  );
}

export default function AdminUser360() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AdminUser360Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ticketNotes, setTicketNotes] = useState<Record<string, string>>({});
  const [txNotes, setTxNotes] = useState<Record<string, string>>({});
  const [inspectOpen, setInspectOpen] = useState(false);
  const [inspectTitle, setInspectTitle] = useState("Details");
  const [inspectData, setInspectData] = useState<unknown>(null);
  const [inspectFormType, setInspectFormType] = useState<string | undefined>(undefined);
  const [inspectSubmission, setInspectSubmission] = useState<AdminFormSubmissionListItem | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getAdminUser360(id);
        if (cancelled) return;
        setData(res);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const user = data?.user;

  const supportTickets = useMemo(() => {
    const rows = (data?.support_tickets || []) as AdminSupportTicketDetail[];
    return rows;
  }, [data?.support_tickets]);

  const transactions = useMemo(() => data?.transactions || [], [data?.transactions]);
  const formSubmissions = useMemo(() => data?.form_submissions || [], [data?.form_submissions]);
  const matches = useMemo(() => data?.matches || [], [data?.matches]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!data || !user) return null;

  const updateTicket = async (ticketId: string, patch: { status?: string; admin_notes?: string | null }) => {
    const updated = await updateAdminSupportTicket(ticketId, patch);
    setData((prev) => {
      if (!prev) return prev;
      const nextTickets = (prev.support_tickets || []).map((t: any) => (t.id === ticketId ? updated : t));
      return { ...prev, support_tickets: nextTickets };
    });
  };

  const updateTx = async (
    txId: string,
    patch: { admin_resolution_status?: "OPEN" | "INVESTIGATING" | "RESOLVED"; admin_notes?: string | null }
  ) => {
    const updated = await updateAdminTransaction(txId, patch);
    setData((prev) => {
      if (!prev) return prev;
      const nextTxs = (prev.transactions || []).map((t) => (t.id === txId ? updated : t));
      return { ...prev, transactions: nextTxs };
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User 360</h1>
          <p className="text-muted-foreground mt-1">
            {user.email} · {user.role} · Created {new Date(user.created_at).toLocaleString()}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/admin/users">Back to users</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="text-sm font-medium">{user.name}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium break-words">{user.email}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="text-sm font-medium">{user.role}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-sm font-medium">{user.is_active ? "Yes" : "No"}</p>
            </div>
            <div className="rounded-md border p-3 sm:col-span-2">
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm font-medium">{new Date(user.created_at).toLocaleString()}</p>
            </div>
            <div className="rounded-md border p-3 sm:col-span-2">
              <p className="text-xs text-muted-foreground">Last login</p>
              <p className="text-sm font-medium">
                {data.last_login_at ? new Date(data.last_login_at).toLocaleString() : "Never"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support tickets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {supportTickets.length === 0 && <p className="text-sm text-muted-foreground">No tickets.</p>}
            {supportTickets.map((t) => (
              <div key={t.id} className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="font-medium">{t.subject}</div>
                  <div className="text-xs text-muted-foreground">{t.status}</div>
                </div>
                <div className="text-xs text-muted-foreground break-words">{t.route || "-"}</div>
                <div className="text-sm whitespace-pre-wrap">{t.description}</div>
                <Textarea
                  value={ticketNotes[t.id] ?? (t.admin_notes ?? "")}
                  onChange={(e) => setTicketNotes((p) => ({ ...p, [t.id]: e.target.value }))}
                  placeholder="Admin notes"
                  rows={2}
                />
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="secondary" onClick={() => void updateTicket(t.id, { status: "triage" })}>
                    Mark triage
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void updateTicket(t.id, { status: "resolved" })}>
                    Mark resolved
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      void updateTicket(t.id, { admin_notes: ticketNotes[t.id] ?? (t.admin_notes ?? "") })
                    }
                  >
                    Save notes
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Login logs ({data.login_events?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!data.login_events?.length && <p className="text-sm text-muted-foreground">No login logs yet.</p>}
            {(data.login_events || []).map((evt) => (
              <div key={evt.id} className="rounded-md border p-3">
                <p className="text-sm font-medium">{new Date(evt.created_at).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground break-words">{evt.email}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form submissions ({formSubmissions.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {formSubmissions.length === 0 && <p className="text-sm text-muted-foreground">No form submissions.</p>}
            {formSubmissions.map((f) => (
              <div key={f.id} className="rounded-md border p-3 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-medium">{f.form_type}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.side} · {new Date(f.created_at).toLocaleString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setInspectTitle(`Form payload · ${f.form_type}`);
                    setInspectData(f.payload ?? {});
                    setInspectFormType(f.form_type);
                    setInspectSubmission(f);
                    setInspectOpen(true);
                  }}
                >
                  Edit payload
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Matches ({matches.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {matches.length === 0 && <p className="text-sm text-muted-foreground">No matches.</p>}
            {matches.map((m) => (
              <div key={m.id} className="rounded-md border p-3">
                <p className="text-sm font-medium">
                  {m.status} · Score {m.match_score}
                </p>
                <p className="text-xs text-muted-foreground break-words">
                  Project: {m.project_id} · Professional: {m.professional_id}
                </p>
                <p className="text-xs text-muted-foreground">
                  Updated {new Date(m.updated_at).toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payments / transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {transactions.length === 0 && <p className="text-sm text-muted-foreground">No transactions.</p>}
          {transactions.map((tx: AdminTransactionListItem) => (
            <div key={tx.id} className="rounded-lg border border-border p-4 space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="font-medium">
                  {tx.transaction_type} · {tx.amount} {tx.currency}
                </div>
                <div className="text-xs text-muted-foreground">{tx.status}</div>
              </div>
              <div className="text-xs text-muted-foreground break-words">
                Order: {tx.razorpay_order_id || "-"} · Payment: {tx.razorpay_payment_id || "-"}
              </div>
              <div className="text-xs text-muted-foreground">
                Resolution: {tx.admin_resolution_status || "-"}
              </div>
              <Textarea
                value={txNotes[tx.id] ?? (tx.admin_notes ?? "")}
                onChange={(e) => setTxNotes((p) => ({ ...p, [tx.id]: e.target.value }))}
                placeholder="Admin notes"
                rows={2}
              />
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="secondary" onClick={() => void updateTx(tx.id, { admin_resolution_status: "OPEN" })}>
                  Open
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void updateTx(tx.id, { admin_resolution_status: "INVESTIGATING" })}>
                  Investigating
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void updateTx(tx.id, { admin_resolution_status: "RESOLVED" })}>
                  Resolved
                </Button>
                <Button
                  size="sm"
                  onClick={() => void updateTx(tx.id, { admin_notes: txNotes[tx.id] ?? (tx.admin_notes ?? "") })}
                >
                  Save notes
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.landowner_profile && (
            <div>
              <p className="text-sm font-semibold mb-2">Landowner profile</p>
              {renderNestedData(data.landowner_profile, "landowner-profile")}
            </div>
          )}
          {data.professional_profile && (
            <div>
              <p className="text-sm font-semibold mb-2">Professional profile</p>
              {renderNestedData(data.professional_profile, "professional-profile")}
            </div>
          )}
          {!data.landowner_profile && !data.professional_profile && (
            <p className="text-sm text-muted-foreground">No profile details available.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={inspectOpen} onOpenChange={setInspectOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{inspectTitle}</DialogTitle>
          </DialogHeader>
          {inspectSubmission ? (
            <Tabs defaultValue="edit">
              <TabsList>
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="mt-4">
                <AdminFormSubmissionPayloadEditor
                  submissionId={inspectSubmission.id}
                  payload={(inspectSubmission.payload ?? {}) as Record<string, unknown>}
                  formType={inspectSubmission.form_type}
                  side={inspectSubmission.side}
                  onSaved={(next) => {
                    setInspectData(next);
                    setInspectSubmission((prev) => (prev ? { ...prev, payload: next } : prev));
                    setData((prev) =>
                      prev
                        ? {
                            ...prev,
                            form_submissions: prev.form_submissions.map((row) =>
                              row.id === inspectSubmission.id ? { ...row, payload: next } : row,
                            ),
                          }
                        : prev,
                    );
                  }}
                  onDeleted={() => {
                    setData((prev) =>
                      prev
                        ? {
                            ...prev,
                            form_submissions: prev.form_submissions.filter((row) => row.id !== inspectSubmission.id),
                          }
                        : prev,
                    );
                    setInspectOpen(false);
                    setInspectSubmission(null);
                  }}
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-4">
                <FormSubmissionPayloadView payload={inspectData} formType={inspectFormType} />
              </TabsContent>
            </Tabs>
          ) : (
            <FormSubmissionPayloadView payload={inspectData} formType={inspectFormType} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

