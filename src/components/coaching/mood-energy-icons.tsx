"use client";

import {
  Frown,
  Meh,
  MinusCircle,
  Smile,
  Laugh,
  BatteryLow,
  BatteryMedium,
  Zap,
  Flame,
} from "lucide-react";
import type { ComponentType } from "react";
import type { Mood, Energy } from "@/types/coaching";
import { cn } from "@/lib/utils";

type IconSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<IconSize, string> = {
  sm: "size-6 [&_svg]:size-3",
  md: "size-8 [&_svg]:size-4",
  lg: "size-10 [&_svg]:size-5",
};

const MOOD_ICONS: Record<Mood, ComponentType<{ className?: string }>> = {
  1: Frown,
  2: Meh,
  3: MinusCircle,
  4: Smile,
  5: Laugh,
};

const MOOD_COLORS: Record<Mood, { text: string; bg: string }> = {
  1: { text: "text-lime-400", bg: "bg-lime-100 dark:bg-lime-400/15" },
  2: { text: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-500/15" },
  3: { text: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-500/15" },
  4: { text: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-500/15" },
  5: { text: "text-green-500", bg: "bg-green-100 dark:bg-green-500/15" },
};

const ENERGY_ICONS: Record<Energy, ComponentType<{ className?: string }>> = {
  1: BatteryLow,
  2: BatteryMedium,
  3: Zap,
  4: Zap,
  5: Flame,
};

const ENERGY_COLORS: Record<Energy, { text: string; bg: string }> = {
  1: { text: "text-lime-400", bg: "bg-lime-100 dark:bg-lime-400/15" },
  2: { text: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-500/15" },
  3: { text: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-500/15" },
  4: { text: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-500/15" },
  5: { text: "text-green-500", bg: "bg-green-100 dark:bg-green-500/15" },
};

function ScaleIcon({
  icon: Icon,
  colors,
  size = "md",
  className,
}: {
  icon: ComponentType<{ className?: string }>;
  colors: { text: string; bg: string };
  size?: IconSize;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg flex items-center justify-center",
        colors.bg,
        SIZE_CLASSES[size],
        className,
      )}
    >
      <Icon className={colors.text} />
    </div>
  );
}

export function MoodIcon({
  mood,
  size = "md",
  className,
}: {
  mood: Mood;
  size?: IconSize;
  className?: string;
}) {
  return (
    <ScaleIcon
      icon={MOOD_ICONS[mood]}
      colors={MOOD_COLORS[mood]}
      size={size}
      className={className}
    />
  );
}

export function EnergyIcon({
  energy,
  size = "md",
  className,
}: {
  energy: Energy;
  size?: IconSize;
  className?: string;
}) {
  return (
    <ScaleIcon
      icon={ENERGY_ICONS[energy]}
      colors={ENERGY_COLORS[energy]}
      size={size}
      className={className}
    />
  );
}

export { MOOD_ICONS, MOOD_COLORS, ENERGY_ICONS, ENERGY_COLORS };
