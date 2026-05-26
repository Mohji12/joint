import { useEffect, useRef, useState } from "react";
import { Upload, X, Camera, Video } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 3;

interface ProjectMediaUploadProps {
  images: File[];
  video: File | null;
  onImagesChange: (files: File[]) => void;
  onVideoChange: (file: File | null) => void;
  className?: string;
}

export function ProjectMediaUpload({
  images,
  video,
  onImagesChange,
  onVideoChange,
  className,
}: ProjectMediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);

  const [liveCameraOpen, setLiveCameraOpen] = useState(false);
  const [liveCameraError, setLiveCameraError] = useState<string | null>(null);

  const handleImageFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const next = [...images, ...list].slice(0, MAX_IMAGES);
    onImagesChange(next);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const handleVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      onVideoChange(file);
    }
    e.target.value = "";
  };

  const stopLiveStream = () => {
    if (liveStreamRef.current) {
      for (const track of liveStreamRef.current.getTracks()) {
        track.stop();
      }
    }
    liveStreamRef.current = null;
  };

  useEffect(() => {
    if (!liveCameraOpen) return;

    let cancelled = false;
    const start = async () => {
      setLiveCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        liveStreamRef.current = stream;
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
          await liveVideoRef.current.play();
        }
      } catch (e) {
        setLiveCameraError(e instanceof Error ? e.message : "Failed to open camera");
      }
    };

    start();
    return () => {
      cancelled = true;
      stopLiveStream();
    };
  }, [liveCameraOpen]);

  useEffect(() => {
    return () => stopLiveStream();
  }, []);

  const captureLivePhoto = async () => {
    const videoEl = liveVideoRef.current;
    const canvasEl = liveCanvasRef.current;
    if (!videoEl || !canvasEl) return;

    const w = videoEl.videoWidth || 1280;
    const h = videoEl.videoHeight || 720;
    canvasEl.width = w;
    canvasEl.height = h;

    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoEl, 0, 0, w, h);

    const blob: Blob | null = await new Promise((resolve) => {
      canvasEl.toBlob((b) => resolve(b), "image/jpeg", 0.92);
    });

    if (!blob) return;

    const filename = `live-photo-${Date.now()}.jpg`;
    const file = new File([blob], filename, { type: "image/jpeg" });
    const next = [...images, file].slice(0, MAX_IMAGES);
    onImagesChange(next);

    setLiveCameraOpen(false);
    stopLiveStream();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Images (max {MAX_IMAGES})</p>
        <div className="flex flex-wrap gap-2 items-center">
          {images.map((img, i) => (
            <div key={i} className="relative w-20 h-20 rounded border border-border overflow-hidden group">
              <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <>
              <label className="w-20 h-20 rounded border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary text-xs text-muted-foreground">
                <Upload className="w-5 h-5 mb-0.5" />
                Upload
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageFiles(e.target.files)}
                />
              </label>
              <label className="w-20 h-20 rounded border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary text-xs text-muted-foreground">
                <Camera className="w-5 h-5 mb-0.5" />
                Take photo
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleImageFiles(e.target.files)}
                />
              </label>
              <button
                type="button"
                onClick={() => setLiveCameraOpen(true)}
                className="w-20 h-20 rounded border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary text-xs text-muted-foreground"
                aria-label="Capture live photo"
              >
                <Camera className="w-5 h-5 mb-0.5" />
                Live photo
              </button>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{images.length} / {MAX_IMAGES} images</p>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Video (1 per project)</p>
        {video ? (
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground truncate max-w-[200px]">{video.name}</span>
            <button
              type="button"
              onClick={() => onVideoChange(null)}
              className="text-destructive text-xs hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <label className="inline-flex items-center gap-2 rounded border-2 border-dashed border-border px-3 py-2 cursor-pointer hover:border-primary text-sm text-muted-foreground">
            <Upload className="w-4 h-4" />
            Upload video
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              capture="environment"
              className="hidden"
              onChange={handleVideoFile}
            />
          </label>
        )}
      </div>

      {liveCameraOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-background border border-border shadow-lg p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">Live photo</p>
              <button
                type="button"
                onClick={() => {
                  setLiveCameraOpen(false);
                  stopLiveStream();
                }}
                className="w-8 h-8 rounded-full border border-border bg-background text-muted-foreground hover:bg-muted/70"
                aria-label="Close live camera"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-black">
              <video
                ref={liveVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>

            {liveCameraError && (
              <p className="text-xs text-destructive">{liveCameraError}</p>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setLiveCameraOpen(false);
                  stopLiveStream();
                }}
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-muted-foreground hover:bg-muted/70"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={captureLivePhoto}
                className="px-3 py-2 rounded-lg border border-border bg-primary text-sm text-primary-foreground hover:opacity-95"
              >
                Capture
              </button>
            </div>

            {/* Used only for capturing the current frame */}
            <canvas ref={liveCanvasRef} className="hidden" />
          </div>
        </div>
      )}
    </div>
  );
}
