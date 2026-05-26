import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Mail } from "lucide-react";
import { getMe, updateProfile, uploadFileAndGetUrl, type ApiUser } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
type AccountProfilePageProps = {
  variant: "builder" | "landowner";
};

export default function AccountProfilePage({ variant }: AccountProfilePageProps) {
  const { refreshUser, user: authUser } = useAuth();
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getMe();
        if (cancelled) return;
        setApiUser(me);
        setName(me.name || "");
        setPhone(me.phone || "");
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const initials =
    (name || apiUser?.name || "")
      .trim()
      .split(/\s+/)
      .map((s) => s[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setError(null);
    setUploading(true);
    try {
      const publicUrl = await uploadFileAndGetUrl(file, "avatars");
      await updateProfile({ avatar_url: publicUrl });
      const me = await getMe();
      setApiUser(me);
      await refreshUser();
      setSuccess("Photo updated.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const updated = await updateProfile({
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setApiUser(updated);
      await refreshUser();
      setSuccess("Profile saved.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading profile…
      </div>
    );
  }

  return (
    <Card className="border-border/80 shadow-sm max-w-xl mx-auto w-full">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Update how you appear on Jointlly as a {variant === "builder" ? "builder" : "landowner"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="relative shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handlePhotoChange}
              disabled={uploading}
            />
            <Avatar className="h-24 w-24 rounded-xl border-2 border-border">
              <AvatarImage src={apiUser?.avatar_url ?? authUser?.avatarUrl} className="object-cover rounded-xl" />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-3 w-full gap-2"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              Change photo
            </Button>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{apiUser?.email}</span>
            </p>
            <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-name">Full name</Label>
            <Input
              id="account-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              minLength={1}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-phone">Mobile number</Label>
            <Input
              id="account-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 …"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-emerald-700" role="status">
              {success}
            </p>
          )}

          <Button type="submit" disabled={saving} className="min-w-[120px]">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
