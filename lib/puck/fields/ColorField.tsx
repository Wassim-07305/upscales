"use client";

import type { CustomField } from "@measured/puck";

const SWATCHES = [
  "#C6FF00", // neon
  "#7FFFD4", // turquoise
  "#FFFFFF",
  "#0D0D0D",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#F7DC6F",
  "#BB8FCE",
  "#F8B500",
];

export const ColorField: CustomField<string> = {
  type: "custom",
  render: ({ value, onChange, field }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">{field.label || "Couleur"}</label>
      <div className="flex flex-wrap gap-2">
        {SWATCHES.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className="size-7 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              backgroundColor: color,
              borderColor: value === color ? "#C6FF00" : "transparent",
              boxShadow: value === color ? `0 0 8px ${color}40` : "none",
            }}
          />
        ))}
      </div>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#C6FF00"
        className="w-full px-3 py-1.5 rounded-md border border-gray-600 bg-gray-800 text-sm text-white"
      />
    </div>
  ),
};
