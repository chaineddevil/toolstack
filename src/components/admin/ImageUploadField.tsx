"use client";

import { useRef, useState } from "react";
import { useController, type Control } from "react-hook-form";

interface ImageUploadFieldProps {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  control: Control<any>;
  name: string;
  label: string;
  folder?: string;
}

export default function ImageUploadField({
  control,
  name,
  label,
  folder = "uploads",
}: ImageUploadFieldProps) {
  const { field } = useController({ control, name });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageUrl = field.value || "";

  // Build a display URL for preview
  const previewUrl = imageUrl.startsWith("http")
    ? imageUrl
    : imageUrl
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-assets/${imageUrl}`
      : "";

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      field.onChange(data.path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => field.onChange(e.target.value)}
          className="flex-1 p-2 border rounded-lg text-sm"
          placeholder="Paste URL or upload an image"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {previewUrl && (
        <div className="mt-3 relative rounded-lg overflow-hidden border border-black/5 inline-block">
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-40 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
    </div>
  );
}
