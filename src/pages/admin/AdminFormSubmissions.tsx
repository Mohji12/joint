import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAdminFormSubmissions, type AdminFormSubmissionListItem } from "@/lib/api";
import { FormSubmissionPayloadView } from "@/components/admin/FormSubmissionPayloadView";
import { AdminFormSubmissionPayloadEditor } from "@/components/admin/AdminFormSubmissionPayloadEditor";

const AdminFormSubmissions = () => {
  const [list, setList] = useState<AdminFormSubmissionListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sideFilter, setSideFilter] = useState<string>("ALL");
  const [formTypeFilter, setFormTypeFilter] = useState<string>("ALL");
  const [selectedSubmission, setSelectedSubmission] = useState<AdminFormSubmissionListItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminFormSubmissions({
      limit: 200,
      side: sideFilter === "ALL" ? undefined : sideFilter,
      form_type: formTypeFilter === "ALL" ? undefined : formTypeFilter,
    })
      .then((data) => {
        if (!cancelled) setList(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sideFilter, formTypeFilter]);

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
      <h1 className="text-3xl font-bold text-foreground mb-2">Form submissions</h1>
      <p className="text-muted-foreground mb-6">Requirements and data from builder/landowner forms.</p>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-lg">List</CardTitle>
          <div className="flex gap-2">
            <Select value={sideFilter} onValueChange={setSideFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Side" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All sides</SelectItem>
                <SelectItem value="builder">Builder</SelectItem>
                <SelectItem value="landowner">Landowner</SelectItem>
              </SelectContent>
            </Select>
            <Select value={formTypeFilter} onValueChange={setFormTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Form type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All types</SelectItem>
                <SelectItem value="joint-venture">Joint venture</SelectItem>
                <SelectItem value="contract-construction">Contract construction</SelectItem>
                <SelectItem value="interior">Interior</SelectItem>
                <SelectItem value="reconstruction">Renovation/Repaint</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Form type</TableHead>
                <TableHead>User email</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(row.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>{row.side}</TableCell>
                  <TableCell>{row.form_type}</TableCell>
                  <TableCell>{row.user_email ?? (row.user_id ? " " : "Anonymous")}</TableCell>
                  <TableCell>
                    {row.payload && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSubmission(row)}
                      >
                        Edit payload
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {list.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No form submissions found.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-auto">
          <DialogHeader className="text-left">
            <DialogTitle>Edit submission payload</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-3 rounded-md border bg-muted/20 p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Form type</p>
                  <p className="text-sm font-medium">{selectedSubmission.form_type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Side</p>
                  <p className="text-sm font-medium">{selectedSubmission.side}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Submitted at</p>
                  <p className="text-sm font-medium">{new Date(selectedSubmission.created_at).toLocaleString()}</p>
                </div>
              </div>

              <Tabs defaultValue="edit">
                <TabsList>
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="edit" className="mt-4">
                  <AdminFormSubmissionPayloadEditor
                    submissionId={selectedSubmission.id}
                    payload={(selectedSubmission.payload ?? {}) as Record<string, unknown>}
                    formType={selectedSubmission.form_type}
                    side={selectedSubmission.side}
                    onSaved={(next) => {
                      setSelectedSubmission((prev) => (prev ? { ...prev, payload: next } : prev));
                      setList((prev) => prev.map((row) => (row.id === selectedSubmission.id ? { ...row, payload: next } : row)));
                    }}
                    onDeleted={() => {
                      setList((prev) => prev.filter((row) => row.id !== selectedSubmission.id));
                      setSelectedSubmission(null);
                    }}
                  />
                </TabsContent>
                <TabsContent value="preview" className="mt-4">
                  <div className="rounded-md border p-3">
                    <FormSubmissionPayloadView
                      payload={selectedSubmission.payload}
                      formType={selectedSubmission.form_type}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFormSubmissions;
