"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Users, Star, Heart } from "lucide-react";
import { DifficultyLevel, Formation } from "@/lib/types/database";
import { formatDuration } from "@/lib/utils/dates";
import { formatPrice, truncate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  isFavorite?: boolean;
  userId?: string;
  showFavorite?: boolean;
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
  isFavorite: initialFavorite = false,
  userId,
  showFavorite = false,
}: FormationCardProps) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) return;
    setLoading(true);

    if (isFavorite) {
      await supabase
        .from("formation_favorites")
        .delete()
        .eq("user_id", userId)
        .eq("formation_id", formation.id);
      setIsFavorite(false);
      toast.success("Retiré des favoris");
    } else {
      await supabase.from("formation_favorites").insert({
        user_id: userId,
        formation_id: formation.id,
      });
      setIsFavorite(true);
      toast.success("Ajouté aux favoris");
    }
    setLoading(false);
  };

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
          <div className="absolute top-3 left-3">
            {showFavorite && userId && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 bg-black/40 backdrop-blur-sm hover:bg-black/60",
                  isFavorite && "text-red-500 hover:text-red-400"
                )}
                onClick={handleToggleFavorite}
                disabled={loading}
              >
                <Heart
                  className={cn("h-4 w-4", isFavorite && "fill-current")}
                />
              </Button>
            )}
          </div>
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
