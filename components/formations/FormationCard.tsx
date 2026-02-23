"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock } from "lucide-react";
import { Formation } from "@/lib/types/database";
import { formatDuration } from "@/lib/utils/dates";
import { formatPrice, truncate } from "@/lib/utils/formatters";

interface FormationCardProps {
  formation: Formation;
  moduleCount?: number;
  totalDuration?: number;
  progress?: number;
  enrolled?: boolean;
}

export function FormationCard({
  formation,
  moduleCount = 0,
  totalDuration = 0,
  progress,
  enrolled,
}: FormationCardProps) {
  return (
    <Link href={`/formations/${formation.id}`}>
      <Card className="group overflow-hidden hover:border-primary/50 transition-all duration-200 h-full">
        {/* Thumbnail */}
        <div className="relative h-40 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
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
          <div className="absolute top-3 right-3">
            <Badge
              variant={formation.is_free ? "secondary" : "default"}
              className={formation.is_free ? "bg-neon/20 text-neon border-neon/30" : ""}
            >
              {formation.is_free ? "Gratuit" : formation.price ? formatPrice(formation.price) : "Premium"}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-2">
            {formation.title}
          </h3>
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
