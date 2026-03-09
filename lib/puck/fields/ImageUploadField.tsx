"use client";

import { useState } from "react";
import type { CustomField } from "@measured/puck";

export const ImageUploadField: CustomField<string> = {
  type: "custom",
  render: ({ value, onChange, field }) => {
    const [uploading, setUploading] = useState(false);

    async function handleUpload(file: File) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", "media");

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");

        const { url } = await res.json();
        onChange(url);
      } catch {
        console.error("Upload error");
      } finally {
        setUploading(false);
      }
    }

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">{field.label || "Image"}</label>
        {value && (
          <div className="relative group">
            <img src={value} alt="" className="w-full h-32 object-cover rounded-lg" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Supprimer
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <label className="flex-1 flex items-center justify-center px-3 py-2 border border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 transition-colors text-sm text-gray-400">
            {uploading ? "Envoi..." : "Choisir une image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
          </label>
        </div>
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-1.5 rounded-md border border-gray-600 bg-gray-800 text-sm text-white"
        />
      </div>
    );
  },
};
