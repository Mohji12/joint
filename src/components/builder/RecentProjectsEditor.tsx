import { useState } from "react";
import { Image as ImageIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadFileAndGetUrl } from "@/lib/api";

export type RecentProject = {
  name_location?: string;
  location?: string;
  built_up_sft?: string;
  type?: string;
  duration_months?: string;
  image_urls?: string[];
  video_url?: string;
};

function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    return (JSON.parse(text) as T) ?? fallback;
  } catch {
    return fallback;
  }
}

export function RecentProjectsEditor({
  value,
  onChange,
  uploadFolder = "builder/portfolio/recent-projects",
}: {
  value: string;
  onChange: (nextJson: string) => void;
  uploadFolder?: string;
}) {
  const projects = safeJsonParse<RecentProject[]>(value.trim() || "[]", []);
  const setProjects = (next: RecentProject[]) => onChange(JSON.stringify(next, null, 2));
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [uploadingVideoIdx, setUploadingVideoIdx] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageUrlDraft, setImageUrlDraft] = useState<Record<number, string>>({});

  const update = (idx: number, patch: Partial<RecentProject>) => {
    const next = projects.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    setProjects(next);
  };

  const remove = (idx: number) => setProjects(projects.filter((_, i) => i !== idx));

  const add = () =>
    setProjects([
      ...projects,
      { name_location: "", built_up_sft: "", type: "", duration_months: "", image_urls: [], video_url: "" },
    ]);

  const uploadImages = async (idx: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingIdx(idx);
    setUploadError(null);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadFileAndGetUrl(file, uploadFolder);
        urls.push(url);
      }
      const current = projects[idx]?.image_urls ?? [];
      update(idx, { image_urls: [...current, ...urls] });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Image upload failed");
    } finally {
      setUploadingIdx(null);
    }
  };

  const uploadVideo = async (idx: number, file: File | null) => {
    if (!file) return;
    setUploadingVideoIdx(idx);
    setUploadError(null);
    try {
      const url = await uploadFileAndGetUrl(file, `${uploadFolder}/videos`);
      update(idx, { video_url: url });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Video upload failed");
    } finally {
      setUploadingVideoIdx(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label>Recent projects / work showcase</Label>
        <Button type="button" size="sm" variant="outline" onClick={add}>
          Add project
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Upload images and videos, or paste URLs from social media (Instagram, YouTube, Cloudinary, etc.).
      </p>

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects added yet.</p>
      ) : (
        <div className="space-y-3">
          {projects.map((p, idx) => (
            <div key={idx} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold">Project {idx + 1}</p>
                <Button type="button" size="sm" variant="destructive" onClick={() => remove(idx)}>
                  Remove
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name / location</Label>
                  <Input value={p.name_location ?? p.location ?? ""} onChange={(e) => update(idx, { name_location: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Input value={p.type ?? ""} onChange={(e) => update(idx, { type: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Built-up (sft)</Label>
                  <Input value={p.built_up_sft ?? ""} onChange={(e) => update(idx, { built_up_sft: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Duration (months)</Label>
                  <Input value={p.duration_months ?? ""} onChange={(e) => update(idx, { duration_months: e.target.value })} />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label>Project images</Label>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium cursor-pointer hover:bg-muted">
                        <ImageIcon className="h-4 w-4" />
                        {uploadingIdx === idx ? "Uploading…" : "Upload images"}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          disabled={uploadingIdx === idx}
                          onChange={(e) => uploadImages(idx, e.target.files)}
                        />
                      </label>
                      {(p.image_urls ?? []).length > 0 ? (
                        <Button type="button" size="sm" variant="outline" onClick={() => update(idx, { image_urls: [] })} disabled={uploadingIdx === idx}>
                          Clear images
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  {(p.image_urls ?? []).length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {(p.image_urls ?? []).map((url, i) => (
                        <a key={`${url}-${i}`} href={url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg ring-1 ring-border">
                          <img src={url} alt="" className="aspect-square w-full object-cover" loading="lazy" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Upload images or add a URL below.</p>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste image URL from social media"
                      value={imageUrlDraft[idx] ?? ""}
                      onChange={(e) => setImageUrlDraft((prev) => ({ ...prev, [idx]: e.target.value }))}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const url = (imageUrlDraft[idx] ?? "").trim();
                        if (!url) return;
                        update(idx, { image_urls: [...(p.image_urls ?? []), url] });
                        setImageUrlDraft((prev) => ({ ...prev, [idx]: "" }));
                      }}
                    >
                      Add URL
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label>Video URL</Label>
                    <label className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium cursor-pointer hover:bg-muted">
                      <Video className="h-4 w-4" />
                      {uploadingVideoIdx === idx ? "Uploading…" : "Upload video"}
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        disabled={uploadingVideoIdx === idx}
                        onChange={(e) => uploadVideo(idx, e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                  <Input
                    value={p.video_url ?? ""}
                    onChange={(e) => update(idx, { video_url: e.target.value })}
                    placeholder="Paste YouTube, Instagram, or uploaded video URL"
                  />
                  {p.video_url ? (
                    <a href={p.video_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                      Open video
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {uploadError ? <p className="text-xs text-destructive">{uploadError}</p> : null}
    </div>
  );
}
