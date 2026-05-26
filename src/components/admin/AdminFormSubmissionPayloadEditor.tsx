import { useEffect, useState } from "react";
import { Image as ImageIcon, Plus, Save, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RecentProjectsEditor } from "@/components/builder/RecentProjectsEditor";
import { isLikelyImageUrl } from "@/components/BuilderPortfolioPayloadView";
import { deleteAdminFormSubmission, uploadFileAndGetUrl, updateAdminFormSubmission } from "@/lib/api";
import { cn } from "@/lib/utils";

function formatLabel(key: string): string {
  return key.replaceAll("_", " ");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isLikelyVideoUrl(s: string): boolean {
  if (!s.startsWith("http")) return false;
  const lower = s.toLowerCase();
  if (lower.includes("res.cloudinary.com") && lower.includes("/video/upload/")) return true;
  return /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(s);
}

function isMediaFieldKey(key: string): boolean {
  return /url|image|video|photo|media/i.test(key);
}

function StringListEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="space-y-2 rounded-md border bg-white p-3">
      <Label>{label}</Label>
      <div className="space-y-2">
        {value.map((item, idx) => (
          <div key={idx} className="flex gap-2">
            <Input
              value={item}
              onChange={(e) => {
                const next = [...value];
                next[idx] = e.target.value;
                onChange(next);
              }}
            />
            <Button type="button" variant="outline" size="icon" onClick={() => onChange(value.filter((_, i) => i !== idx))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, ""])}>
        <Plus className="h-4 w-4 mr-1" />
        Add item
      </Button>
    </div>
  );
}

function MediaUrlField({
  label,
  value,
  onChange,
  uploadFolder,
  kind,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  uploadFolder: string;
  kind: "image" | "video" | "auto";
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resolvedKind =
    kind === "auto"
      ? isLikelyVideoUrl(value)
        ? "video"
        : "image"
      : kind;

  const onUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const folder = resolvedKind === "video" ? `${uploadFolder}/videos` : uploadFolder;
      const url = await uploadFileAndGetUrl(file, folder);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2 rounded-md border bg-white p-3">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Paste image or video URL" />
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer">
          <input
            type="file"
            accept={resolvedKind === "video" ? "video/*" : "image/*"}
            className="sr-only"
            onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
            disabled={uploading}
          />
          <Button type="button" variant="outline" size="sm" asChild disabled={uploading}>
            <span>
              {resolvedKind === "video" ? <Video className="h-4 w-4 mr-1 inline" /> : <ImageIcon className="h-4 w-4 mr-1 inline" />}
              {uploading ? "Uploading…" : "Upload file"}
            </span>
          </Button>
        </label>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {value && isLikelyImageUrl(value) ? (
        <img src={value} alt="" className="max-h-40 rounded border object-contain" referrerPolicy="no-referrer" />
      ) : null}
      {value && isLikelyVideoUrl(value) ? (
        <video src={value} controls className="max-h-48 w-full rounded border bg-black" preload="metadata" />
      ) : null}
    </div>
  );
}

function ImageUrlsEditor({
  label,
  value,
  onChange,
  uploadFolder,
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  uploadFolder: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        urls.push(await uploadFileAndGetUrl(file, uploadFolder));
      }
      onChange([...value, ...urls]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-md border bg-white p-3">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer">
          <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => void uploadFiles(e.target.files)} disabled={uploading} />
          <Button type="button" variant="outline" size="sm" asChild disabled={uploading}>
            <span>
              <ImageIcon className="h-4 w-4 mr-1 inline" />
              {uploading ? "Uploading…" : "Upload images"}
            </span>
          </Button>
        </label>
      </div>
      <div className="flex gap-2">
        <Input value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} placeholder="Paste image URL" />
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            const trimmed = urlDraft.trim();
            if (!trimmed) return;
            onChange([...value, trimmed]);
            setUrlDraft("");
          }}
        >
          Add URL
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {value.map((url, idx) => (
          <div key={`${url}-${idx}`} className="relative rounded border p-2">
            {isLikelyImageUrl(url) ? (
              <img src={url} alt="" className="mx-auto max-h-36 w-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              <p className="truncate text-xs">{url}</p>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 w-full text-destructive"
              onClick={() => onChange(value.filter((_, i) => i !== idx))}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function JsonFieldEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(value ?? {}, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(JSON.stringify(value ?? {}, null, 2));
  }, [value]);

  return (
    <div className="space-y-2 rounded-md border bg-white p-3">
      <Label>{label}</Label>
      <Textarea
        rows={8}
        className="font-mono text-xs"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
        }}
        onBlur={() => {
          try {
            onChange(JSON.parse(text));
            setError(null);
          } catch {
            setError("Invalid JSON — fix before saving.");
          }
        }}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function PayloadValueEditor({
  fieldKey,
  value,
  onChange,
  uploadFolder,
  depth = 0,
  onRemoveField,
}: {
  fieldKey: string;
  value: unknown;
  onChange: (next: unknown) => void;
  uploadFolder: string;
  depth?: number;
  onRemoveField?: () => void;
}) {
  const label = formatLabel(fieldKey);

  const fieldHeader = (
    <div className="flex items-center justify-between gap-2">
      {depth > 0 ? <Label>{label}</Label> : null}
      {onRemoveField ? (
        <Button type="button" variant="ghost" size="sm" className="text-destructive shrink-0" onClick={onRemoveField}>
          <Trash2 className="h-4 w-4 mr-1" />
          Remove
        </Button>
      ) : null}
    </div>
  );

  if (fieldKey === "recent_projects" && Array.isArray(value)) {
    return (
      <RecentProjectsEditor
        value={JSON.stringify(value, null, 2)}
        onChange={(json) => {
          try {
            onChange(JSON.parse(json));
          } catch {
            /* keep last valid */
          }
        }}
        uploadFolder={`${uploadFolder}/recent-projects`}
      />
    );
  }

  if (fieldKey === "pricing" && isRecord(value)) {
    return <JsonFieldEditor label={label} value={value} onChange={onChange} />;
  }

  if (Array.isArray(value)) {
    if (value.every((x) => typeof x === "string")) {
      if (fieldKey === "project_types" || fieldKey === "subcontractor_scopes") {
        return <StringListEditor label={label} value={value as string[]} onChange={(next) => onChange(next.filter(Boolean))} />;
      }
      if (isMediaFieldKey(fieldKey) || (value as string[]).some((s) => isLikelyImageUrl(s))) {
        return (
          <ImageUrlsEditor
            label={label}
            value={value as string[]}
            onChange={onChange}
            uploadFolder={`${uploadFolder}/${fieldKey}`}
          />
        );
      }
      return <StringListEditor label={label} value={value as string[]} onChange={(next) => onChange(next.filter(Boolean))} />;
    }

    if (value.every((x) => isRecord(x))) {
      return (
        <div className="space-y-3 rounded-md border bg-muted/20 p-3">
          <Label>{label}</Label>
          {(value as Record<string, unknown>[]).map((item, idx) => (
            <div key={idx} className="space-y-2 rounded-md border bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {label} {idx + 1}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => onChange((value as Record<string, unknown>[]).filter((_, i) => i !== idx))}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove item
                </Button>
              </div>
              {Object.entries(item).map(([k, v]) => (
                <PayloadValueEditor
                  key={k}
                  fieldKey={k}
                  value={v}
                  onChange={(next) => {
                    const arr = [...(value as Record<string, unknown>[])];
                    arr[idx] = { ...arr[idx], [k]: next };
                    onChange(arr);
                  }}
                  onRemoveField={() => {
                    const arr = [...(value as Record<string, unknown>[])];
                    const nextItem = { ...arr[idx] };
                    delete nextItem[k];
                    arr[idx] = nextItem;
                    onChange(arr);
                  }}
                  uploadFolder={`${uploadFolder}/${fieldKey}`}
                  depth={depth + 1}
                />
              ))}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange([...(value as Record<string, unknown>[]), {}])}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add {label.toLowerCase()} item
          </Button>
        </div>
      );
    }
  }

  if (typeof value === "string") {
    if (isMediaFieldKey(fieldKey) || isLikelyImageUrl(value) || isLikelyVideoUrl(value)) {
      return (
        <MediaUrlField
          label={label}
          value={value}
          onChange={onChange}
          uploadFolder={`${uploadFolder}/${fieldKey}`}
          kind={fieldKey.includes("video") ? "video" : "auto"}
        />
      );
    }
    if (value.length > 120 || fieldKey.includes("details") || fieldKey.includes("description")) {
      return (
        <div className="space-y-2 rounded-md border bg-white p-3">
          <Label>{label}</Label>
          <Textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    }
    return (
      <div className="space-y-2 rounded-md border bg-white p-3">
        <Label>{label}</Label>
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return (
      <div className="space-y-2 rounded-md border bg-white p-3">
        <Label>{label}</Label>
        <Input
          value={String(value)}
          onChange={(e) => {
            if (typeof value === "boolean") onChange(e.target.value === "true");
            else onChange(Number(e.target.value));
          }}
        />
      </div>
    );
  }

  if (isRecord(value)) {
    return (
      <div className={cn("space-y-3 rounded-md border bg-white p-3", depth > 0 && "border-dashed")}>
        {fieldHeader}
        {Object.entries(value).map(([k, v]) => (
          <PayloadValueEditor
            key={k}
            fieldKey={k}
            value={v}
            onChange={(next) => onChange({ ...value, [k]: next })}
            onRemoveField={() => {
              const next = { ...value };
              delete next[k];
              onChange(next);
            }}
            uploadFolder={`${uploadFolder}/${k}`}
            depth={depth + 1}
          />
        ))}
      </div>
    );
  }

  if (value === null || value === undefined) {
    return (
      <div className="space-y-2 rounded-md border bg-white p-3">
        <Label>{label}</Label>
        <Input value="" onChange={(e) => onChange(e.target.value)} placeholder="Enter value" />
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-md border bg-white p-3">
      <Label>{label}</Label>
      <Textarea rows={3} className="font-mono text-xs" value={JSON.stringify(value)} readOnly />
    </div>
  );
}

export function AdminFormSubmissionPayloadEditor({
  submissionId,
  payload,
  formType,
  side,
  onSaved,
  onDeleted,
}: {
  submissionId: string;
  payload: Record<string, unknown>;
  formType: string;
  side: string;
  onSaved?: (next: Record<string, unknown>) => void;
  onDeleted?: () => void;
}) {
  const [draft, setDraft] = useState<Record<string, unknown>>(payload);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newFieldKey, setNewFieldKey] = useState("");

  useEffect(() => {
    setDraft(payload);
  }, [payload, submissionId]);

  const uploadFolder = `admin/form-submissions/${side}/${formType}`;

  const setField = (key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const removeField = (key: string) => {
    setDraft((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const addField = () => {
    const key = newFieldKey.trim().replace(/\s+/g, "_");
    if (!key || key in draft) return;
    setField(key, "");
    setNewFieldKey("");
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await updateAdminFormSubmission(submissionId, draft);
      setDraft(result.payload ?? draft);
      setSuccess("Payload saved successfully.");
      onSaved?.(result.payload ?? draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteSubmission = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteAdminFormSubmission(submissionId);
      onDeleted?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const keys = Object.keys(draft);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Edit text, images, and videos. Remove individual fields or delete the entire submission.
        </p>
        <div className="flex flex-wrap gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting || saving}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete submission
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this form submission?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the submission and all payload data (text, images, videos). This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => void onDeleteSubmission()}
                >
                  {deleting ? "Deleting…" : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={() => void onSave()} disabled={saving || deleting}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving…" : "Save payload"}
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/5 p-3">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700 rounded-md border border-emerald-200 bg-emerald-50 p-3">{success}</p> : null}

      <div className="space-y-4">
        {keys.length === 0 ? (
          <p className="text-sm text-muted-foreground">Empty payload — add fields below.</p>
        ) : (
          keys.map((key) => (
            <div key={key} className="rounded-md border bg-muted/10 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold capitalize">{formatLabel(key)}</p>
                <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => removeField(key)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove field
                </Button>
              </div>
              <PayloadValueEditor
                fieldKey={key}
                value={draft[key]}
                onChange={(next) => setField(key, next)}
                uploadFolder={uploadFolder}
              />
            </div>
          ))
        )}
      </div>

      <div className="flex flex-wrap gap-2 rounded-md border bg-muted/20 p-3">
        <Input
          value={newFieldKey}
          onChange={(e) => setNewFieldKey(e.target.value)}
          placeholder="New field name (e.g. project_details)"
          className="max-w-xs bg-white"
        />
        <Button type="button" variant="outline" onClick={addField} disabled={!newFieldKey.trim()}>
          <Plus className="h-4 w-4 mr-1" />
          Add field
        </Button>
      </div>
    </div>
  );
}
