import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  downloadAdminProfessionalExportByRecord,
  downloadAdminProfessionalsBulkExport,
  getAdminProfessionals,
  listAdminProfessionalExports,
  type AdminBuilderExportRecord,
  type AdminProfessionalListItem,
} from "@/lib/api";
import { downloadBlob } from "@/lib/downloadFile";

function saveBlob(blob: Blob, fileName: string) {
  downloadBlob(blob, fileName);
}

function approvalVariant(status: AdminProfessionalListItem["approval_status"]): "secondary" | "default" | "destructive" {
  if (status === "APPROVED") return "default";
  if (status === "REJECTED") return "destructive";
  return "secondary";
}

const AdminProfessionals = () => {
  const [list, setList] = useState<AdminProfessionalListItem[]>([]);
  const [exportsList, setExportsList] = useState<AdminBuilderExportRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulkDownloading, setBulkDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getAdminProfessionals({ limit: 200 }),
      listAdminProfessionalExports({ limit: 20 }),
    ])
      .then(([pros, exportsRows]) => {
        if (!cancelled) {
          setList(pros);
          setExportsList(exportsRows);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load professionals");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onDownloadBulk = async () => {
    setBulkDownloading(true);
    setError(null);
    try {
      const file = await downloadAdminProfessionalsBulkExport({ limit: 1000 });
      saveBlob(file.blob, file.fileName);
      const exportsRows = await listAdminProfessionalExports({ limit: 20 });
      setExportsList(exportsRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk export failed");
    } finally {
      setBulkDownloading(false);
    }
  };

  const onDownloadHistoryItem = async (exportId: string) => {
    setError(null);
    try {
      const file = await downloadAdminProfessionalExportByRecord(exportId);
      saveBlob(file.blob, file.fileName);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-2">Professionals</h1>
      <p className="text-muted-foreground mb-6">Builder and professional profiles with capability summary.</p>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-lg">List</CardTitle>
          <Button onClick={onDownloadBulk} disabled={bulkDownloading}>
            {bulkDownloading ? "Preparing..." : "Bulk Excel Download"}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Capabilities</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.company_name}</TableCell>
                  <TableCell>{row.user_email ?? " "}</TableCell>
                  <TableCell>{row.city ?? " "}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {row.capability_types.map((c) => (
                        <Badge key={c} variant="secondary">{c}</Badge>
                      ))}
                      {row.capability_types.length === 0 && " "}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={approvalVariant(row.approval_status)}>{row.approval_status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/admin/professionals/${row.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {list.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No professionals found.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Recent Export Files</CardTitle>
        </CardHeader>
        <CardContent>
          {exportsList.length === 0 ? (
            <p className="text-muted-foreground">No export history yet.</p>
          ) : (
            <div className="space-y-2">
              {exportsList.map((x) => (
                <div key={x.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="text-sm">
                    <p className="font-medium">{x.file_name}</p>
                    <p className="text-muted-foreground">
                      {x.scope} · rows: {x.row_count} · {new Date(x.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onDownloadHistoryItem(x.id)}>
                    Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProfessionals;
