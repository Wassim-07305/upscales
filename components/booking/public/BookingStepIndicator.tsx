"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingStepIndicatorProps {
  currentStep: 1 | 2 | 3;
  brandColor: string;
}

const STEPS = [
  { number: 1, label: "Informations" },
  { number: 2, label: "Créneau" },
  { number: 3, label: "Confirmation" },
] as const;

export function BookingStepIndicator({
  currentStep,
  brandColor,
}: BookingStepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {STEPS.map((s, idx) => {
        const isCompleted = currentStep > s.number;
        const isActive = currentStep === s.number;
        const isFuture = currentStep < s.number;

        return (
          <div key={s.number} className="flex items-center gap-2 sm:gap-3">
            {/* Cercle + label */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center justify-center size-8 rounded-full text-xs font-semibold transition-all duration-300 shrink-0",
                  isFuture &&
                    "bg-[#1C1C1C] text-muted-foreground border border-[#2A2A2A]"
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: brandColor,
                        color: "#0D0D0D",
                        boxShadow: `0 0 16px ${brandColor}40`,
                      }
                    : isCompleted
                      ? {
                          backgroundColor: `${brandColor}20`,
                          color: brandColor,
                          border: `1px solid ${brandColor}40`,
                        }
                      : undefined
                }
              >
                {isCompleted ? (
                  <Check className="size-4" />
                ) : (
                  <span>{s.number}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium hidden sm:inline transition-colors duration-300",
                  isActive && "text-foreground",
                  isCompleted && "text-foreground",
                  isFuture && "text-muted-foreground"
                )}
                style={isActive ? { color: brandColor } : undefined}
              >
                {s.label}
              </span>
            </div>

            {/* Separateur */}
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-6 sm:w-10 transition-colors duration-300"
                )}
                style={{
                  backgroundColor: isCompleted
                    ? `${brandColor}60`
                    : "#2A2A2A",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
