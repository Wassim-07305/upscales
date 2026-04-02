/**
 * Returns a contrasting text color (dark or white) for a given hex background color.
 * Ensures button text remains readable regardless of the accent color chosen.
 */
export function getContrastColor(hex: string): string {
  // Fallback for invalid/missing hex
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return "#0D0D0D";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // WCAG relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#0D0D0D" : "#FFFFFF";
}
