import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, UserCircle, Briefcase, FileText, FolderOpen, Link2, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminStats, type AdminStats } from "@/lib/api";

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAdminStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load stats");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  if (!stats) return null;

  const cards: Array<{ label: string; value: number; icon: typeof Users; path?: string; sub?: string }> = [
    { label: "Total users", value: stats.total_users, icon: Users, path: "/admin/users", sub: `${stats.users_landowner} landowners, ${stats.users_professional} professionals` },
    { label: "Landowners", value: stats.total_landowners, icon: UserCircle, path: "/admin/landowners" },
    { label: "Professionals", value: stats.total_professionals, icon: Briefcase, path: "/admin/professionals" },
    { label: "Projects", value: stats.total_projects, icon: FolderOpen, sub: `${stats.projects_draft} draft, ${stats.projects_published} published` },
    { label: "Form submissions", value: stats.total_form_submissions, icon: FileText, path: "/admin/form-submissions" },
    { label: "Connections", value: stats.total_projects, icon: Link2, path: "/admin/connections", sub: "Marketplace selection records" },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-2 mt-0">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-8">Overview of users and requirements.</p>

      <Link
        to="/admin/settings"
        className="mb-8 flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:bg-muted/40 transition-colors"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-foreground">Change admin password</p>
          <p className="text-sm text-muted-foreground">Update your login password — no OTP required.</p>
        </div>
      </Link>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((item) => {
          const card = (
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">{item.label}</CardTitle>
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{item.value}</p>
                {item.sub && <p className="text-xs text-muted-foreground mt-1">{item.sub}</p>}
              </CardContent>
            </Card>
          );
          return item.path ? (
            <Link key={item.label} to={item.path}>
              {card}
            </Link>
          ) : (
            <div key={item.label}>{card}</div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboard;
