"use client";

import React, { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { PresignedUploadResponse } from "@/types/api";

export const ALLOWED_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
export const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export type PresignAvatarResponse = PresignedUploadResponse;

/**
 * 2-Step Avatar Upload Workflow (Recipe A):
 * 1. Validates client-side: mime type in image/jpeg, image/png, image/webp and size <= 5 MB.
 * 2. Presign: POST /api/v1/users/me/profile-image -> { uploadUrl, key }
 * 3. Direct PUT: PUT uploadUrl with raw file binary and Content-Type: file.type
 * 4. Confirm: POST /api/v1/users/me/profile-image/confirm with { key } and Idempotency-Key
 */
export async function uploadAvatarWorkflow(file: File): Promise<void> {
  // 1. Client-side validation
  if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type "${file.type || "unknown"}". Allowed formats: image/jpeg, image/png, image/webp.`
    );
  }

  if (file.size > MAX_AVATAR_FILE_SIZE) {
    throw new Error("File size exceeds 5MB limit. Please choose a smaller file.");
  }

  // 2. Presign request
  const presignData = await apiClient<PresignAvatarResponse>(
    "/api/v1/users/me/profile-image",
    {
      method: "POST",
      body: JSON.stringify({
        contentType: file.type,
        contentLength: file.size,
      }),
    }
  );

  if (!presignData || !presignData.uploadUrl || !presignData.key) {
    throw new Error("Failed to obtain presigned upload URL from server.");
  }

  // 3. Direct PUT to Cloudflare R2 / Storage
  const uploadResponse = await fetch(presignData.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error(
      `Failed to upload avatar image to storage (${uploadResponse.status} ${uploadResponse.statusText})`
    );
  }

  // 4. Confirm upload
  const idempotencyKey =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `idemp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  await apiClient("/api/v1/users/me/profile-image/confirm", {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      key: presignData.key,
    }),
  });
}

export interface AvatarUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

export function AvatarUploadDialog({
  isOpen,
  onClose,
  onUploadSuccess,
}: AvatarUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URL when component unmounts or previewUrl changes
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Reset dialog state when closed
  const resetState = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    resetState();
    onClose();
  };

  const handleCloseRef = useRef(handleClose);
  handleCloseRef.current = handleClose;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isUploading) {
        handleCloseRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isUploading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Client-side validation
    if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.type)) {
      setError("Invalid file type. Allowed formats: image/jpeg, image/png, image/webp.");
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      setError("File size exceeds 5MB limit. Please choose a smaller file.");
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setSelectedFile(file);

    if (previewUrl && previewUrl.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch {
        // Ignore revoke errors
      }
    }

    if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
      try {
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        return;
      } catch {
        // Fall back to FileReader
      }
    }

    if (typeof FileReader !== "undefined") {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setError(null);
    setIsUploading(true);

    try {
      await uploadAvatarWorkflow(selectedFile);
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      handleClose();
    } catch (err: any) {
      const message =
        err?.detail ||
        err?.message ||
        "Failed to upload avatar. Please try again.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2
              id="avatar-dialog-title"
              className="text-lg font-semibold text-foreground"
            >
              Upload Avatar
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              JPG, PNG, or WebP up to 5MB
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            aria-label="Close dialog"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg bg-destructive/15 border border-destructive/20 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="h-28 w-28 rounded-full border-2 border-dashed border-border overflow-hidden flex items-center justify-center bg-muted/40 shadow-inner">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-center p-2 text-muted-foreground">
                  <svg
                    className="mx-auto h-8 w-8 opacity-60"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                  <span className="text-[10px] block mt-1">No file chosen</span>
                </div>
              )}
            </div>

            <div className="w-full">
              <label
                htmlFor="avatar-file-input"
                className="block text-xs font-medium text-muted-foreground mb-1.5"
              >
                Choose avatar image
              </label>
              <input
                id="avatar-file-input"
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={isUploading}
                onChange={handleFileChange}
                className="w-full text-xs text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer cursor-pointer border rounded-md p-1 bg-background"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!selectedFile || isUploading}
            onClick={handleUpload}
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Uploading...
              </span>
            ) : (
              "Upload"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
