import { useEffect, useState } from "react";
import { getAdminConnections, type AdminConnectionRecord } from "@/lib/api";

const AdminConnections = () => {
  const [rows, setRows] = useState<AdminConnectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getAdminConnections({ limit: 200 });
        if (!active) return;
        setRows(data);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Failed to load connections");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Marketplace Connections</h1>
        <p className="text-sm text-muted-foreground">
          Landowner-builder selection events with payment and contact traceability.
        </p>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading connections...</div>}
      {error && <div className="text-sm text-destructive">{error}</div>}
      {!loading && !error && rows.length === 0 && (
        <div className="text-sm text-muted-foreground">No connection records found.</div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr className="text-left">
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Selection</th>
                <th className="px-3 py-2">Landowner</th>
                <th className="px-3 py-2">Builder</th>
                <th className="px-3 py-2">Project</th>
                <th className="px-3 py-2">Payment</th>
                <th className="px-3 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.match_id} className="border-t">
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="px-3 py-2">{r.selection_side || "-"}</td>
                  <td className="px-3 py-2">
                    <div>{r.landowner_name || "-"}</div>
                    <div className="text-xs text-muted-foreground">{r.landowner_email || "-"}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div>{r.builder_company_name || "-"}</div>
                    <div className="text-xs text-muted-foreground">{r.builder_email || "-"}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div>{r.project_type || "-"}</div>
                    <div className="text-xs text-muted-foreground">{r.project_city || "-"}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div>{r.payment_status || "-"}</div>
                    <div className="text-xs text-muted-foreground">{r.payment_id || r.payment_order_id || "-"}</div>
                  </td>
                  <td className="px-3 py-2">{new Date(r.updated_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminConnections;
