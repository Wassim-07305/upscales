"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, CheckCircle, Clock, RotateCcw, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ExerciseBlockProps {
  moduleId: string;
  formationId: string;
  userId: string;
  completed: boolean;
  onComplete: () => void;
}

interface Submission {
  id: string;
  content: string;
  attachments: { name: string; url: string }[];
  status: string;
  grade: number | null;
  feedback: string | null;
  reviewed_by: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "En attente de correction", color: "bg-amber-500/20 text-amber-400", icon: Clock },
  reviewed: { label: "Corrige", color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle },
  revision_requested: { label: "Revision demandee", color: "bg-blue-500/20 text-blue-400", icon: RotateCcw },
};

export function ExerciseBlock({ moduleId, formationId, userId, completed, onComplete }: ExerciseBlockProps) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchSubmission() {
      const { data } = await supabase
        .from("exercise_submissions")
        .select("*")
        .eq("module_id", moduleId)
        .eq("user_id", userId)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setSubmission(data);
        setContent(data.content || "");
      }
      setLoading(false);
    }
    fetchSubmission();
  }, [moduleId, userId]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);

    if (submission) {
      const { data, error } = await supabase
        .from("exercise_submissions")
        .update({ content: content.trim(), status: "pending", submitted_at: new Date().toISOString() })
        .eq("id", submission.id)
        .select()
        .single();
      if (error) {
        toast.error("Erreur lors de la mise a jour");
      } else {
        setSubmission(data);
        toast.success("Exercice soumis a nouveau");
      }
    } else {
      const { data, error } = await supabase
        .from("exercise_submissions")
        .insert({
          module_id: moduleId,
          formation_id: formationId,
          user_id: userId,
          content: content.trim(),
          status: "pending",
        })
        .select()
        .single();
      if (error) {
        toast.error("Erreur lors de la soumission");
      } else {
        setSubmission(data);
        toast.success("Exercice soumis avec succes");
        if (!completed) onComplete();
      }
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const status = submission ? STATUS_CONFIG[submission.status] : null;
  const canEdit = !submission || submission.status === "revision_requested";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-primary" />
          Exercice a soumettre
          {status && (
            <Badge variant="outline" className={cn("text-[10px] ml-auto", status.color)}>
              <status.icon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Feedback du coach */}
        {submission?.feedback && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Feedback du coach</p>
            <p className="text-sm">{submission.feedback}</p>
            {submission.grade !== null && (
              <p className="text-sm mt-2 font-bold text-primary">Note : {submission.grade}/100</p>
            )}
          </div>
        )}

        {/* Zone de saisie */}
        {canEdit ? (
          <>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Redigez votre reponse a l'exercice..."
              className="min-h-[150px] bg-[#141414]"
            />
            <Button onClick={handleSubmit} disabled={!content.trim() || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              {submission ? "Resoumettre" : "Soumettre"}
            </Button>
          </>
        ) : (
          <div className="p-3 bg-[#141414] rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Votre soumission</p>
            <p className="text-sm whitespace-pre-wrap">{submission?.content}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
