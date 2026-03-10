"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Loader2, Pencil, Trash2 } from "lucide-react";
import { getInitials } from "@/lib/utils/formatters";
import { timeAgo } from "@/lib/utils/dates";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  author: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

interface FormationReviewsProps {
  formationId: string;
  reviews: Review[];
  currentUserId: string;
  enrolled: boolean;
  averageRating: number;
}

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}) {
  const [hover, setHover] = useState(0);
  const sizeClass = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={cn(
            "transition-colors",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          )}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => onChange?.(star)}
        >
          <Star
            className={cn(
              sizeClass,
              (hover || value) >= star
                ? "fill-[#FFB800] text-[#FFB800]"
                : "text-muted-foreground/30"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function FormationReviews({
  formationId,
  reviews: initialReviews,
  currentUserId,
  enrolled,
  averageRating,
}: FormationReviewsProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const supabase = createClient();

  const existingReview = reviews.find((r) => r.user_id === currentUserId);
  const showForm = enrolled && !existingReview && !editingId;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Veuillez donner une note");
      return;
    }
    setSaving(true);

    const data = {
      formation_id: formationId,
      user_id: currentUserId,
      rating,
      comment: comment.trim() || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("formation_reviews")
        .update({ rating, comment: comment.trim() || null, updated_at: new Date().toISOString() })
        .eq("id", editingId);

      if (error) {
        toast.error("Erreur", { description: error.message });
      } else {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === editingId ? { ...r, rating, comment: comment.trim() || null } : r
          )
        );
        toast.success("Avis mis à jour");
        setEditingId(null);
      }
    } else {
      const { data: created, error } = await supabase
        .from("formation_reviews")
        .insert(data)
        .select("*, author:profiles!formation_reviews_user_id_fkey(full_name, avatar_url)")
        .single();

      if (error) {
        toast.error("Erreur", { description: error.message });
      } else if (created) {
        setReviews((prev) => [created as unknown as Review, ...prev]);
        toast.success("Merci pour votre avis !");
      }
    }

    setRating(0);
    setComment("");
    setSaving(false);
  };

  const handleEdit = (review: Review) => {
    setEditingId(review.id);
    setRating(review.rating);
    setComment(review.comment || "");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("formation_reviews").delete().eq("id", id);
    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success("Avis supprimé");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setRating(0);
    setComment("");
  };

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : averageRating;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Avis ({reviews.length})
          </CardTitle>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <StarRating value={Math.round(avgRating)} readonly size="sm" />
              <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulaire d'avis */}
        {(showForm || editingId) && (
          <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-3">
            <p className="text-sm font-medium">
              {editingId ? "Modifier votre avis" : "Donnez votre avis"}
            </p>
            <StarRating value={rating} onChange={setRating} />
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience (optionnel)..."
              className="bg-[#141414] min-h-[80px]"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || saving}
                size="sm"
              >
                {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                {editingId ? "Mettre à jour" : "Publier"}
              </Button>
              {editingId && (
                <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                  Annuler
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Liste des avis */}
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun avis pour le moment
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={review.author?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-primary/20 text-primary">
                    {getInitials(review.author?.full_name || "")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {review.author?.full_name || "Anonyme"}
                    </span>
                    <StarRating value={review.rating} readonly size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(review.created_at)}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {review.comment}
                    </p>
                  )}
                </div>
                {review.user_id === currentUserId && !editingId && (
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleEdit(review)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDelete(review.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
