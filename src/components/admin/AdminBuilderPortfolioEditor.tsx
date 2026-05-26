import { useCallback, useEffect, useState } from "react";
import { Pencil, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecentProjectsEditor } from "@/components/builder/RecentProjectsEditor";
import {
  getAdminBuilderPortfolio,
  updateAdminBuilderFormSubmission,
  updateAdminProfessionalProfile,
  type BuilderPortfolioLatest,
  type FormSubmissionDetail,
} from "@/lib/api";

function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    return (JSON.parse(text) as T) ?? fallback;
  } catch {
    return fallback;
  }
}

function strField(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  return v == null ? "" : String(v);
}

type FormDraft = {
  company_name: string;
  years_experience: string;
  license_rera: string;
  address: string;
  team_type: string;
  project_details: string;
  preferred_location: string;
  projects_completed: string;
  recentProjectsJson: string;
};

function payloadToDraft(payload: Record<string, unknown>): FormDraft {
  const recent = payload.recent_projects;
  return {
    company_name: strField(payload, "company_name"),
    years_experience: strField(payload, "years_experience"),
    license_rera: strField(payload, "license_rera"),
    address: strField(payload, "address"),
    team_type: strField(payload, "team_type"),
    project_details: strField(payload, "project_details"),
    preferred_location: strField(payload, "preferred_location"),
    projects_completed: strField(payload, "projects_completed"),
    recentProjectsJson: JSON.stringify(Array.isArray(recent) ? recent : [], null, 2),
  };
}

function draftToPayload(base: Record<string, unknown>, draft: FormDraft): Record<string, unknown> {
  const recent_projects = safeJsonParse<unknown[]>(draft.recentProjectsJson, []);
  return {
    ...base,
    company_name: draft.company_name.trim(),
    years_experience: draft.years_experience.trim(),
    license_rera: draft.license_rera.trim(),
    address: draft.address.trim(),
    team_type: draft.team_type.trim(),
    project_details: draft.project_details.trim(),
    preferred_location: draft.preferred_location.trim(),
    projects_completed: draft.projects_completed.trim(),
    recent_projects,
  };
}

function FormSubmissionEditor({
  professionalId,
  submission,
  label,
  onSaved,
}: {
  professionalId: string;
  submission: FormSubmissionDetail;
  label: string;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<FormDraft>(() => payloadToDraft(submission.payload ?? {}));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setDraft(payloadToDraft(submission.payload ?? {}));
  }, [submission]);

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = draftToPayload(submission.payload ?? {}, draft);
      await updateAdminBuilderFormSubmission(professionalId, submission.id, payload);
      setSuccess("Saved successfully.");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            Last submitted {new Date(submission.created_at).toLocaleString()}
          </p>
        </div>
        <Button onClick={onSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save form"}
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Company name</Label>
          <Input value={draft.company_name} onChange={(e) => setDraft((d) => ({ ...d, company_name: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Years of experience</Label>
          <Input value={draft.years_experience} onChange={(e) => setDraft((d) => ({ ...d, years_experience: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>License / RERA</Label>
          <Input value={draft.license_rera} onChange={(e) => setDraft((d) => ({ ...d, license_rera: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Team type</Label>
          <Input value={draft.team_type} onChange={(e) => setDraft((d) => ({ ...d, team_type: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Preferred location</Label>
          <Input value={draft.preferred_location} onChange={(e) => setDraft((d) => ({ ...d, preferred_location: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Projects completed</Label>
          <Input value={draft.projects_completed} onChange={(e) => setDraft((d) => ({ ...d, projects_completed: e.target.value }))} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Registered address</Label>
          <Textarea rows={2} value={draft.address} onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Project details</Label>
          <Textarea rows={3} value={draft.project_details} onChange={(e) => setDraft((d) => ({ ...d, project_details: e.target.value }))} />
        </div>
      </div>

      <RecentProjectsEditor
        value={draft.recentProjectsJson}
        onChange={(nextJson) => setDraft((d) => ({ ...d, recentProjectsJson: nextJson }))}
        uploadFolder="admin/builder-portfolio"
      />
    </div>
  );
}

export function AdminBuilderPortfolioEditor({
  professionalId,
  initialProfile,
}: {
  professionalId: string;
  initialProfile: Record<string, unknown>;
}) {
  const [portfolio, setPortfolio] = useState<BuilderPortfolioLatest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileDraft, setProfileDraft] = useState({
    company_name: strField(initialProfile, "company_name"),
    phone: strField(initialProfile, "phone"),
    city: strField(initialProfile, "city"),
    experience_years: strField(initialProfile, "experience_years"),
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const loadPortfolio = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminBuilderPortfolio(professionalId);
      setPortfolio(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load builder portfolio");
    } finally {
      setLoading(false);
    }
  }, [professionalId]);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      await updateAdminProfessionalProfile(professionalId, {
        company_name: profileDraft.company_name.trim(),
        phone: profileDraft.phone.trim() || null,
        city: profileDraft.city.trim() || null,
        experience_years: profileDraft.experience_years.trim()
          ? Number(profileDraft.experience_years)
          : null,
      });
      setProfileMessage("Profile updated.");
    } catch (e) {
      setProfileMessage(e instanceof Error ? e.message : "Profile update failed");
    } finally {
      setProfileSaving(false);
    }
  };

  const tabs = [
    { key: "contract", label: "Contract construction", submission: portfolio?.contract_construction },
    { key: "jv", label: "Joint venture", submission: portfolio?.joint_venture },
    { key: "interior", label: "Interior", submission: portfolio?.interior },
    { key: "renovation", label: "Renovation", submission: portfolio?.renovation_repaint },
  ] as const;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Pencil className="h-5 w-5" />
          Edit builder profile &amp; work
        </CardTitle>
        <CardDescription>
          Update company details and portfolio when builders share images or videos via social media.
          Upload files directly or paste URLs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">Professional profile</p>
            <Button variant="outline" size="sm" onClick={saveProfile} disabled={profileSaving}>
              {profileSaving ? "Saving..." : "Save profile"}
            </Button>
          </div>
          {profileMessage ? (
            <p className={`text-sm ${profileMessage.endsWith(".") && !profileMessage.includes("failed") ? "text-emerald-700" : "text-destructive"}`}>
              {profileMessage}
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Company name</Label>
              <Input
                value={profileDraft.company_name}
                onChange={(e) => setProfileDraft((d) => ({ ...d, company_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={profileDraft.phone} onChange={(e) => setProfileDraft((d) => ({ ...d, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={profileDraft.city} onChange={(e) => setProfileDraft((d) => ({ ...d, city: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Experience (years)</Label>
              <Input
                value={profileDraft.experience_years}
                onChange={(e) => setProfileDraft((d) => ({ ...d, experience_years: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading builder forms...</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <Tabs defaultValue="contract">
            <TabsList className="flex flex-wrap h-auto gap-1">
              {tabs.map((t) => (
                <TabsTrigger key={t.key} value={t.key} disabled={!t.submission}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((t) => (
              <TabsContent key={t.key} value={t.key} className="mt-4">
                {t.submission ? (
                  <FormSubmissionEditor
                    professionalId={professionalId}
                    submission={t.submission}
                    label={t.label}
                    onSaved={loadPortfolio}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No {t.label.toLowerCase()} submission yet.</p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
