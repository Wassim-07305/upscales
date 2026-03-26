"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Users, Star, Heart } from "lucide-react";
import { DifficultyLevel } from "@/lib/types/database";
import { formatDuration } from "@/lib/utils/dates";
import { formatPrice } from "@/lib/utils/formatters";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { FormationData } from "./FormationGrid";

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

interface FormationListItemProps {
  formation: FormationData;
  userId: string;
}

export function FormationListItem({ formation, userId }: FormationListItemProps) {
  const [isFavorite, setIsFavorite] = useState(formation.isFavorite);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
      <Card className="group hover:border-primary/30 transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Thumbnail */}
            <div className="relative h-20 w-32 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-primary/15 via-turquoise/5 to-transparent">
              {formation.thumbnail_url ? (
                <Image
                  src={formation.thumbnail_url}
                  alt={formation.title}
                  fill
                  sizes="128px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <BookOpen className="h-6 w-6 text-primary/40" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                  {formation.title}
                </h3>
                <div className="flex gap-1.5 shrink-0">
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
                    className={cn("text-[10px]", formation.is_free && "bg-neon/20 text-neon border-neon/30")}
                  >
                    {formation.is_free
                      ? "Gratuit"
                      : formation.price
                        ? formatPrice(formation.price)
                        : "Premium"}
                  </Badge>
                </div>
              </div>

              {formation.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {formation.description}
                </p>
              )}

              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {formation.moduleCount} modules
                </span>
                {formation.totalDuration > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(formation.totalDuration)}
                  </span>
                )}
                {formation.enrolledCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {formation.enrolledCount}
                  </span>
                )}
                {formation.averageRating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-[#FFB800] text-[#FFB800]" />
                    {formation.averageRating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>

            {/* Progress / Favorite */}
            <div className="flex items-center gap-3 shrink-0">
              {formation.enrolled && (
                <div className="w-24">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-muted-foreground">Progression</span>
                    <span className="font-medium">{formation.progress}%</span>
                  </div>
                  <Progress value={formation.progress} className="h-1.5" />
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                className={cn(
                  "h-8 w-8",
                  isFavorite && "text-red-500 hover:text-red-400"
                )}
                onClick={handleToggleFavorite}
                disabled={loading}
              >
                <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
