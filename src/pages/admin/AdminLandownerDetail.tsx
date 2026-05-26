import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAdminLandownerDetail, type AdminLandownerDetail as AdminLandownerDetailType } from "@/lib/api";

const AdminLandownerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<AdminLandownerDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getAdminLandownerDetail(id)
      .then((data) => {
        if (!cancelled) setDetail(data);
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
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-8">
        <p className="text-destructive">{error ?? "Not found"}</p>
        <Button variant="link" asChild className="mt-4">
          <Link to="/admin/landowners">Back to landowners</Link>
        </Button>
      </div>
    );
  }

  const { profile, user_email, user_name, properties, projects } = detail;

  return (
    <div className="max-w-6xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link to="/admin/landowners" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to landowners
        </Link>
      </Button>

      <h1 className="text-3xl font-bold text-foreground mb-2">Landowner detail</h1>
      <p className="text-muted-foreground mb-8">
        {user_name ?? profile.name} {user_email && `(${user_email})`}
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="font-medium">Name:</span> {profile.name}</p>
          <p><span className="font-medium">Phone:</span> {profile.phone ?? " "}</p>
          <p><span className="font-medium">City:</span> {profile.city ?? " "}</p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Properties ({properties.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <p className="text-muted-foreground">No properties.</p>
          ) : (
            <ul className="space-y-2">
              {properties.map((prop: Record<string, unknown>) => (
                <li key={String(prop.id)} className="border-b border-border pb-2 last:border-0">
                  <p className="font-medium">{String(prop.city)}</p>
                  <p className="text-sm text-muted-foreground">
                    {prop.ward && `Ward: ${prop.ward}`}
                    {prop.landmark && ` · ${prop.landmark}`}
                    {prop.pid_number && ` · PID: ${prop.pid_number}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Projects ({projects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-muted-foreground">No projects.</p>
          ) : (
            <ul className="space-y-2">
              {projects.map((proj: Record<string, unknown>) => (
                <li key={String(proj.id)} className="border-b border-border pb-2 last:border-0">
                  <p className="font-medium">{String(proj.project_type)} · {String(proj.status)}</p>
                  <p className="text-sm text-muted-foreground">
                    {proj.intent && `Intent: ${proj.intent}`}
                    {proj.timeline && ` · ${proj.timeline}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLandownerDetail;
