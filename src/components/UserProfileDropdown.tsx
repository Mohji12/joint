import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { User as UserIcon, Building2, Mail, Phone, Camera, Shield, Lock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { uploadFileAndGetUrl, updateProfile } from "@/lib/api";

type UserProfileDropdownProps = {
  variant: "landowner" | "builder" | "admin";
  className?: string;
  triggerClassName?: string;
};

export function UserProfileDropdown({
  variant,
  className,
  triggerClassName,
}: UserProfileDropdownProps) {
  const { user, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploadError(null);
    setUploading(true);
    try {
      const publicUrl = await uploadFileAndGetUrl(file, "avatars");
      await updateProfile({ avatar_url: publicUrl });
      await refreshUser();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const openFilePicker = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const Icon = variant === "admin" ? Shield : variant === "builder" ? Building2 : UserIcon;
  const initials = user.name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-3 rounded-lg outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
          triggerClassName
        )}
        asChild
      >
        <button
          type="button"
          className={cn(
            "flex items-center gap-3 group w-full lg:w-auto",
            variant === "landowner" && "rounded-lg",
            variant === "builder" && "rounded-lg"
          )}
        >
          <Avatar className="h-10 w-10 rounded-lg bg-green-600 border-2 border-white/20">
            <AvatarImage src={user.avatarUrl} alt={user.name} className="rounded-lg object-cover" />
            <AvatarFallback className="rounded-lg bg-green-600 text-white text-sm font-medium">
              {initials || <Icon className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          <div className="hidden lg:block text-left">
            <div className="font-semibold text-black text-lg">
              {variant === "admin" ? "Admin" : variant === "builder" ? "Builder" : "Landowner"}
            </div>
            <div className="text-xs text-gray-500">
              {variant === "admin" ? "Administrator" : variant === "builder" ? "Construction Company" : "Property Owner"}
            </div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className={cn("w-72 p-0 overflow-hidden", className)}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-4 bg-white" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handlePhotoChange}
                disabled={uploading}
                />
              <button
                type="button"
                onClick={openFilePicker}
                disabled={uploading}
                className="relative block cursor-pointer rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:pointer-events-none"
              >
                <Avatar className="h-14 w-14 rounded-xl border-2 border-gray-100 ring-0 transition-[box-shadow] hover:ring-2 hover:ring-green-500/30">
                  <AvatarImage src={user.avatarUrl} alt={user.name} className="rounded-xl object-cover" />
                  <AvatarFallback className="rounded-xl bg-green-100 text-green-700 text-lg font-semibold">
                    {initials || <Icon className="h-7 w-7" />}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    "absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity hover:opacity-100",
                    uploading && "opacity-100 bg-black/50"
                  )}
                >
                  {uploading ? (
                    <span className="text-xs font-medium text-white">Uploading…</span>
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </span>
              </button>
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-semibold text-black truncate">{user.name}</p>
              <p className="text-sm text-gray-600 truncate flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                {user.email}
              </p>
              {user.mobile ? (
                <p className="text-sm text-gray-600 truncate flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                  {user.mobile}
                </p>
              ) : (
                <p className="text-sm text-gray-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  No mobile added
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={openFilePicker}
            disabled={uploading}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:border-green-300 hover:text-green-700 transition-colors disabled:opacity-50"
          >
            <Camera className="h-4 w-4" />
            {uploading ? "Uploading…" : "Change photo"}
          </button>
          {uploadError && (
            <p className="mt-2 text-xs text-red-600" role="alert">
              {uploadError}
            </p>
          )}
          {variant === "admin" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/admin/settings" className="flex items-center gap-2 cursor-pointer">
                  <Lock className="h-4 w-4" />
                  Change password
                </Link>
              </DropdownMenuItem>
            </>
          )}
          {user.userType === "admin" && variant !== "admin" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                  <Shield className="h-4 w-4" />
                  Admin dashboard
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
