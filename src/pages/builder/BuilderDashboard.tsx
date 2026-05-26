import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Hammer, Handshake, Palette, Wrench, Plus, FileText, CheckCircle2, ArrowRight, Users, Store, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BuilderProfileCard } from "../../components/BuilderProfileCard";
import { useAuth } from "@/hooks/useAuth";
import { getProfessionalProfile, listProfessionalCapabilities } from "@/lib/api";
import type { BuilderProfile } from "@/components/BuilderProfileCard";

const CAPABILITY_TO_FORM_TYPE: Record<string, string> = {
  CONSTRUCTION: "contract-construction",
  JV_JD: "joint-venture",
  INTERIOR: "interior",
  RECONSTRUCTION: "reconstruction",
};

const quickActions = [
  { path: "/builder/contract-construction", label: "Contract construction", icon: Hammer, desc: "Register or update your contract construction profile.", color: "bg-primary" },
  { path: "/builder/joint-venture", label: "JV / JD developer", icon: Handshake, desc: "Register or update your JV/JD developer profile.", color: "bg-primary" },
  { path: "/builder/interior", label: "Interior architect", icon: Palette, desc: "Register or update your interior design profile.", color: "bg-primary" },
  { path: "/builder/reconstruction", label: "Renovation / repaint", icon: Wrench, desc: "Register or update your repair & painting profile.", color: "bg-primary" },
];

const BuilderDashboard = () => {
  const { isAuthenticated, user } = useAuth();
  const [profiles, setProfiles] = useState<BuilderProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (isAuthenticated && user?.userType === "builder") {
        try {
          const [profile, capabilities] = await Promise.all([
            getProfessionalProfile(),
            listProfessionalCapabilities(),
          ]);
          if (cancelled) return;
          const apiProfiles: BuilderProfile[] = capabilities.map((cap) => ({
            profileId: profile.id,
            type: CAPABILITY_TO_FORM_TYPE[cap.capability_type] || cap.capability_type.toLowerCase(),
            companyName: profile.company_name,
            address: profile.city ?? undefined,
            yearsExperience: profile.experience_years?.toString(),
            submittedAt: profile.updated_at,
            verified: false,
          }));
          setProfiles(apiProfiles);
        } catch {
          if (cancelled) return;
          setProfiles([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      } else {
        const stored = localStorage.getItem("builderProfiles");
        if (stored) {
          const parsed = JSON.parse(stored);
          const withIds = parsed.map((p: Record<string, unknown>, i: number) => ({
            ...p,
            profileId: (p.profileId as string) || `builder-${i}-${String(p.type || "profile")}-${String((p.submittedAt as string) || "")}`,
          }));
          setProfiles(withIds);
        } else {
          setProfiles([]);
        }
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.userType]);

  const getProfileStatus = (type: string) => {
    return profiles.some(p => p.type === type);
  };

  const stats = [
    { label: "Active Profiles", value: profiles.length, icon: FileText, color: "text-primary" },
    { label: "Published", value: profiles.length, icon: CheckCircle2, color: "text-primary" },
    { label: "Your matches", value: 0, icon: Users, color: "text-primary" },
  ];

  return (
    <div className="min-h-0 bg-background flex flex-col">
      {/* Professional Header */}
      <header className="sticky top-0 z-30 bg-primary text-primary-foreground border-b border-primary/20 shrink-0 lg:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-xl font-bold">Jointlly</Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  to="/builder/dashboard"
                  className="text-sm font-medium hover:text-primary-foreground/90 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/builder/matches"
                  className="text-sm font-medium hover:text-primary-foreground/90 transition-colors"
                >
                  Your matches
                </Link>
                <Link
                  to="/builder/marketplace"
                  className="text-sm font-medium hover:text-primary-foreground/90 transition-colors"
                >
                  Opportunities
                </Link>
              </nav>
            </div>
            <Link to="/builder/options">
              <Button variant="secondary" className="gap-2">
                <Plus className="w-4 h-4" />
                Post Listing
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full pt-4 pb-8 sm:pt-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Manage your profiles and view matching opportunities. Update your capacity or browse landowner requests.</p>
        </div>

        {/* Instruction banner */}
        <section className="mb-8">
          <div className="rounded-xl border border-border bg-card p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Create your opportunity listing</h2>
                <p className="text-sm text-muted-foreground">
                  To get published on Opportunities, complete the form for your service type (contract construction, JV/JD, interior, or renovation).
                </p>
              </div>
            </div>
            <Link to="/builder/options">
              <Button className="w-full md:w-auto gap-2">
                Fill the form
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                <span className="text-2xl font-bold text-foreground">{stat.value}</span>
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Featured Profiles Section */}
        {profiles.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Featured Profiles</h2>
              <Link to="/builder/my-projects" className="text-sm text-primary hover:text-primary/90 font-medium flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.slice(0, 6).map((profile, index) => (
                <BuilderProfileCard key={index} profile={profile} index={index} variant="compact" />
              ))}
            </div>
          </section>
        )}

        {/* Register Profile Section */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">Register or Update Profile</h2>
          <p className="text-muted-foreground mb-6">Select your area of expertise to submit or update your details.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, i) => {
              const isCompleted = getProfileStatus(action.path.split("/").pop() || "");
              return (
                <Link key={action.path} to={action.path} className="block h-full">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className={`flex flex-col rounded-xl border-2 p-6 hover:shadow-md transition-all cursor-pointer bg-card min-h-[220px] h-full ${
                      isCompleted ? "border-primary" : "border-border hover:border-primary"
                    }`}
                  >
                    <div className={`w-12 h-12 shrink-0 ${action.color} rounded-lg flex items-center justify-center mb-4 text-primary-foreground`}>
                      <action.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-2">{action.label}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">{action.desc}</p>
                    {isCompleted && (
                      <div className="flex items-center gap-2 text-sm text-primary mt-auto pt-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Completed</span>
                      </div>
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Opportunities quick link */}
        <section className="mt-12">
          <div className="rounded-xl border border-border bg-card p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Opportunities</h3>
                <p className="text-sm text-muted-foreground">
                  Browse landowner listings and evaluate projects matched to your profile.
                </p>
              </div>
            </div>
            <Link to="/builder/marketplace">
              <Button className="w-full md:w-auto">Open Opportunities</Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default BuilderDashboard;
