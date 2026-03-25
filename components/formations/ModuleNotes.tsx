"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Save, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ModuleNotesProps {
  moduleId: string;
  formationId: string;
  initialContent: string;
}

export function ModuleNotes({ moduleId, formationId, initialContent }: ModuleNotesProps) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(!!initialContent);
  const supabase = createClient();

  // Auto-save avec debounce
  const saveNote = useCallback(
    async (text: string) => {
      setSaving(true);
      setSaved(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSaving(false);
        return;
      }

      if (text.trim()) {
        const { error } = await supabase.from("module_notes").upsert(
          {
            user_id: user.id,
            module_id: moduleId,
            formation_id: formationId,
            content: text.trim(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,module_id" }
        );
        if (error) {
          toast.error("Erreur lors de la sauvegarde de la note");
        } else {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }
      } else {
        // Supprimer la note si vide
        await supabase
          .from("module_notes")
          .delete()
          .eq("module_id", moduleId)
          .eq("user_id", user.id);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }

      setSaving(false);
    },
    [moduleId, formationId, supabase]
  );

  // Debounce auto-save (2 secondes après la dernière frappe)
  useEffect(() => {
    if (content === initialContent) return;
    const timer = setTimeout(() => {
      saveNote(content);
    }, 2000);
    return () => clearTimeout(timer);
  }, [content, initialContent, saveNote]);

  if (!expanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setExpanded(true)}
        className="gap-2"
      >
        <StickyNote className="h-4 w-4" />
        Prendre des notes
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-primary" />
            Mes notes
          </CardTitle>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Sauvegarde...
              </span>
            )}
            {saved && (
              <span className="flex items-center gap-1 text-xs text-neon">
                <Check className="h-3 w-3" />
                Sauvegardé
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => saveNote(content)}
              disabled={saving}
            >
              <Save className="h-3 w-3 mr-1" />
              Sauvegarder
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Notez les points importants, vos questions, vos idées..."
          className={cn(
            "min-h-[120px] w-full min-w-0 resize-y bg-muted/30 border-0 text-sm",
            "focus-visible:ring-1 focus-visible:ring-primary/50"
          )}
        />
      </CardContent>
    </Card>
  );
}
