import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  downloadAdminProfessionalExport,
  getAdminProfessionalDetail,
  updateAdminProfessionalApproval,
  type AdminProfessionalDetail as AdminProfessionalDetailType,
} from "@/lib/api";
import { AdminBuilderPortfolioEditor } from "@/components/admin/AdminBuilderPortfolioEditor";
import { downloadBlob } from "@/lib/downloadFile";

const AdminProfessionalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<AdminProfessionalDetailType | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [approving, setApproving] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getAdminProfessionalDetail(id)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const onChangeApproval = async (status: "APPROVED" | "REJECTED") => {
    if (!id || !detail) return;
    setApproving(true);
    setActionError(null);
    try {
      await updateAdminProfessionalApproval(id, { status, note: note || undefined });
      const refreshed = await getAdminProfessionalDetail(id);
      setDetail(refreshed);
      setNote("");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Approval update failed");
    } finally {
      setApproving(false);
    }
  };

  const onExport = async () => {
    if (!id) return;
    setExporting(true);
    setActionError(null);
    try {
      const file = await downloadAdminProfessionalExport(id);
      downloadBlob(file.blob, file.fileName);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700" />
      </div>
    );
  }

  if (loadError || !detail) {
    return (
      <div className="p-8">
        <p className="text-destructive">{loadError ?? "Not found"}</p>
        <Button variant="link" asChild className="mt-4">
          <Link to="/admin/professionals">Back to professionals</Link>
        </Button>
      </div>
    );
  }

  const {
    profile,
    user_email,
    user_name,
    capabilities,
    licenses,
    portfolio,
    pricing_tiers,
    location_preferences,
    approval_status,
    approval_note,
    has_builder_submission,
  } = detail;
  const profileObj = profile as Record<string, unknown>;

  return (
    <div className="max-w-6xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link to="/admin/professionals" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to professionals
        </Link>
      </Button>

      <h1 className="text-3xl font-bold text-foreground mb-2">Professional detail</h1>
      <p className="text-muted-foreground mb-8">
        {String(profileObj.company_name ?? user_name)} {user_email && `(${user_email})`}
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Admin approval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {actionError && (
            <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/5 p-3">
              {actionError}
            </p>
          )}
          <p className="text-sm">
            <span className="font-medium">Current status:</span>{" "}
            <Badge variant={approval_status === "APPROVED" ? "default" : approval_status === "REJECTED" ? "destructive" : "secondary"}>
              {approval_status}
            </Badge>
          </p>
          {!has_builder_submission && (
            <p className="text-sm text-destructive">
              This builder cannot be approved yet. At least one of the 4 builder forms must be submitted.
            </p>
          )}
          <Textarea
            placeholder="Add approval/rejection note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {approval_note && (
            <p className="text-sm text-muted-foreground">
              Previous note: {approval_note}
            </p>
          )}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => onChangeApproval("APPROVED")}
              disabled={!has_builder_submission || approving}
            >
              {approving ? "Updating..." : "Approve"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => onChangeApproval("REJECTED")}
              disabled={!has_builder_submission || approving}
            >
              {approving ? "Updating..." : "Reject"}
            </Button>
            <Button variant="outline" onClick={onExport} disabled={exporting}>
              {exporting ? "Preparing..." : "Download Builder Excel"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AdminBuilderPortfolioEditor professionalId={id!} initialProfile={profileObj} />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Location preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {location_preferences.map((loc) => (
              <Badge key={loc} variant="secondary">{loc}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Capabilities ({capabilities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {capabilities.length === 0 ? (
            <p className="text-muted-foreground">None.</p>
          ) : (
            <ul className="space-y-1">
              {capabilities.map((c: Record<string, unknown>) => (
                <li key={String(c.id)}><Badge variant="outline">{String(c.capability_type)}</Badge></li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Licenses ({licenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {licenses.length === 0 ? (
            <p className="text-muted-foreground">None.</p>
          ) : (
            <ul className="space-y-2">
              {licenses.map((l: Record<string, unknown>) => (
                <li key={String(l.id)} className="text-sm">
                  {String(l.license_number)}
                  {l.issuing_authority && ` · ${l.issuing_authority}`}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Portfolio ({portfolio.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {portfolio.length === 0 ? (
            <p className="text-muted-foreground">None.</p>
          ) : (
            <ul className="space-y-2">
              {portfolio.map((p: Record<string, unknown>) => (
                <li key={String(p.id)} className="text-sm">
                  <span className="font-medium">{String(p.project_name)}</span>
                  {p.location && ` · ${p.location}`}
                  {p.area_sqft != null && ` · ${p.area_sqft} sqft`}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pricing tiers ({pricing_tiers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pricing_tiers.length === 0 ? (
            <p className="text-muted-foreground">None.</p>
          ) : (
            <ul className="space-y-2">
              {pricing_tiers.map((pt: Record<string, unknown>) => (
                <li key={String(pt.id)} className="text-sm">
                  {String(pt.capability_type)} · ₹{pt.price_per_sqft}/sqft
                  {pt.tier_name && ` (${pt.tier_name})`}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProfessionalDetail;
