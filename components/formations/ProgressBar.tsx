"use client";

import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  value: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ProgressBar({ value, showLabel = true, size = "md" }: ProgressBarProps) {
  const heightClass = size === "sm" ? "h-1" : size === "lg" ? "h-3" : "h-2";

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Progression</span>
          <span className="font-medium">{value}%</span>
        </div>
      )}
      <Progress value={value} className={heightClass} />
    </div>
  );
}
