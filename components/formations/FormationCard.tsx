"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Users, Star } from "lucide-react";
import { DifficultyLevel, Formation } from "@/lib/types/database";
import { formatDuration } from "@/lib/utils/dates";
import { formatPrice, truncate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

const DIFFICULTY_CONFIG: Record<
  DifficultyLevel,
  { label: string; className: string }
> = {
  beginner: { label: "Débutant", className: "bg-neon/20 text-neon border-neon/30" },
  intermediate: {
    label: "Intermédiaire",
    className: "bg-[#FFB800]/20 text-[#FFB800] border-[#FFB800]/30",
  },
  advanced: {
    label: "Avancé",
    className: "bg-destructive/20 text-destructive border-destructive/30",
  },
};

interface FormationCardProps {
  formation: Formation;
  moduleCount?: number;
  totalDuration?: number;
  enrolledCount?: number;
  progress?: number;
  enrolled?: boolean;
  averageRating?: number;
  reviewCount?: number;
}

export function FormationCard({
  formation,
  moduleCount = 0,
  totalDuration = 0,
  enrolledCount,
  progress,
  enrolled,
  averageRating,
  reviewCount,
}: FormationCardProps) {
  return (
    <Link href={`/formations/${formation.id}`}>
      <Card className="group overflow-hidden hover:border-primary/30 transition-all duration-300 h-full">
        {/* Thumbnail */}
        <div className="relative h-40 bg-gradient-to-br from-primary/15 via-turquoise/5 to-transparent overflow-hidden">
          {formation.thumbnail_url ? (
            <img
              src={formation.thumbnail_url}
              alt={formation.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <BookOpen className="h-12 w-12 text-primary/40" />
            </div>
          )}
          <div className="absolute top-3 right-3 flex gap-1.5">
            {formation.difficulty && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  DIFFICULTY_CONFIG[formation.difficulty]?.className
                )}
              >
                {DIFFICULTY_CONFIG[formation.difficulty]?.label}
              </Badge>
            )}
            <Badge
              variant={formation.is_free ? "secondary" : "default"}
              className={formation.is_free ? "bg-neon/20 text-neon border-neon/30" : ""}
            >
              {formation.is_free
                ? "Gratuit"
                : formation.price
                  ? formatPrice(formation.price)
                  : "Premium"}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-2">
            {formation.title}
          </h3>
          {formation.category && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {formation.category}
            </Badge>
          )}
          {formation.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {formation.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {moduleCount} modules
            </span>
            {totalDuration > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(totalDuration)}
              </span>
            )}
            {enrolledCount !== undefined && enrolledCount > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {enrolledCount} inscrits
              </span>
            )}
            {averageRating !== undefined && averageRating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-[#FFB800] text-[#FFB800]" />
                {averageRating.toFixed(1)}
                {reviewCount !== undefined && <span>({reviewCount})</span>}
              </span>
            )}
          </div>

          {enrolled && progress !== undefined && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progression</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
