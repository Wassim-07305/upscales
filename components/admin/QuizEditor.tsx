"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Loader2,
  Save,
  GripVertical,
  CheckCircle,
  Circle,
  HelpCircle,
} from "lucide-react";
import { Quiz, QuizQuestion, QuizOption } from "@/lib/types/database";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface QuestionWithOptions extends QuizQuestion {
  options: QuizOption[];
}

interface QuizEditorProps {
  moduleId: string;
  moduleTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuizEditor({ moduleId, moduleTitle, open, onOpenChange }: QuizEditorProps) {
  const supabase = createClient();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [passingScore, setPassingScore] = useState("70");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadQuiz = useCallback(async () => {
    setLoading(true);

    // Charger le quiz existant pour ce module
    const { data: existingQuiz } = await supabase
      .from("quizzes")
      .select("*")
      .eq("module_id", moduleId)
      .single();

    if (existingQuiz) {
      setQuiz(existingQuiz);
      setQuizTitle(existingQuiz.title);
      setPassingScore(String(existingQuiz.passing_score));

      // Charger les questions et options
      const { data: questionsData } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", existingQuiz.id)
        .order("order");

      if (questionsData && questionsData.length > 0) {
        const { data: optionsData } = await supabase
          .from("quiz_options")
          .select("*")
          .in("question_id", questionsData.map((q) => q.id))
          .order("order");

        const questionsWithOptions: QuestionWithOptions[] = questionsData.map((q) => ({
          ...q,
          options: (optionsData || []).filter((o) => o.question_id === q.id),
        }));

        setQuestions(questionsWithOptions);
      } else {
        setQuestions([]);
      }
    } else {
      setQuiz(null);
      setQuizTitle(moduleTitle);
      setPassingScore("70");
      setQuestions([]);
    }

    setLoading(false);
  }, [moduleId, moduleTitle, supabase]);

  useEffect(() => {
    if (open) {
      loadQuiz();
    }
  }, [open, loadQuiz]);

  const handleSaveQuiz = async () => {
    if (!quizTitle.trim()) return;
    setSaving(true);

    const score = parseInt(passingScore) || 70;

    if (quiz) {
      // Mettre à jour le quiz
      const { data: updated, error } = await supabase
        .from("quizzes")
        .update({ title: quizTitle.trim(), passing_score: score })
        .eq("id", quiz.id)
        .select()
        .single();

      if (error) {
        toast.error("Erreur", { description: error.message });
      } else if (updated) {
        setQuiz(updated);
        toast.success("Quiz mis à jour");
      }
    } else {
      // Créer le quiz
      const { data: created, error } = await supabase
        .from("quizzes")
        .insert({
          module_id: moduleId,
          title: quizTitle.trim(),
          passing_score: score,
        })
        .select()
        .single();

      if (error) {
        toast.error("Erreur", { description: error.message });
      } else if (created) {
        setQuiz(created);
        toast.success("Quiz créé");
      }
    }

    setSaving(false);
  };

  const handleAddQuestion = async () => {
    if (!quiz) {
      toast.error("Créez d'abord le quiz");
      return;
    }

    const newOrder = questions.length;
    const { data: created, error } = await supabase
      .from("quiz_questions")
      .insert({
        quiz_id: quiz.id,
        question: "Nouvelle question",
        order: newOrder,
      })
      .select()
      .single();

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else if (created) {
      // Ajouter 2 options par défaut
      const { data: options } = await supabase
        .from("quiz_options")
        .insert([
          { question_id: created.id, option_text: "Option A", is_correct: true, order: 0 },
          { question_id: created.id, option_text: "Option B", is_correct: false, order: 1 },
        ])
        .select();

      setQuestions((prev) => [
        ...prev,
        { ...created, options: options || [] },
      ]);
      toast.success("Question ajoutée");
    }
  };

  const handleUpdateQuestion = async (questionId: string, text: string) => {
    const { error } = await supabase
      .from("quiz_questions")
      .update({ question: text })
      .eq("id", questionId);

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, question: text } : q))
      );
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    // Les options seront supprimées en cascade
    const { error } = await supabase
      .from("quiz_questions")
      .delete()
      .eq("id", questionId);

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      toast.success("Question supprimée");
    }
  };

  const handleAddOption = async (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    const newOrder = question.options.length;
    const { data: created, error } = await supabase
      .from("quiz_options")
      .insert({
        question_id: questionId,
        option_text: `Option ${String.fromCharCode(65 + newOrder)}`,
        is_correct: false,
        order: newOrder,
      })
      .select()
      .single();

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else if (created) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, options: [...q.options, created] } : q
        )
      );
    }
  };

  const handleUpdateOption = async (questionId: string, optionId: string, text: string) => {
    const { error } = await supabase
      .from("quiz_options")
      .update({ option_text: text })
      .eq("id", optionId);

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? {
                ...q,
                options: q.options.map((o) =>
                  o.id === optionId ? { ...o, option_text: text } : o
                ),
              }
            : q
        )
      );
    }
  };

  const handleToggleCorrect = async (questionId: string, optionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    // Mettre toutes les options à false, puis la sélectionnée à true
    const updates = question.options.map((o) => ({
      id: o.id,
      is_correct: o.id === optionId,
    }));

    for (const update of updates) {
      await supabase
        .from("quiz_options")
        .update({ is_correct: update.is_correct })
        .eq("id", update.id);
    }

    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((o) => ({
                ...o,
                is_correct: o.id === optionId,
              })),
            }
          : q
      )
    );
  };

  const handleDeleteOption = async (questionId: string, optionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question || question.options.length <= 2) {
      toast.error("Minimum 2 options par question");
      return;
    }

    const { error } = await supabase
      .from("quiz_options")
      .delete()
      .eq("id", optionId);

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? { ...q, options: q.options.filter((o) => o.id !== optionId) }
            : q
        )
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Éditeur de quiz — {moduleTitle}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Paramètres du quiz */}
            <Card className="bg-[#1C1C1C] border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Paramètres du quiz</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Titre du quiz</Label>
                  <Input
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    className="bg-[#141414]"
                    placeholder="Ex: Quiz final — Module 3"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Score requis pour valider (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={passingScore}
                    onChange={(e) => setPassingScore(e.target.value)}
                    className="bg-[#141414] w-32"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveQuiz}
                  disabled={!quizTitle.trim() || saving}
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-3.5 w-3.5" />
                  )}
                  {quiz ? "Mettre à jour" : "Créer le quiz"}
                </Button>
              </CardContent>
            </Card>

            {/* Questions */}
            {quiz && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">
                    Questions ({questions.length})
                  </h3>
                  <Button size="sm" variant="outline" onClick={handleAddQuestion}>
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Ajouter une question
                  </Button>
                </div>

                {questions.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground border border-dashed border-border rounded-lg">
                    <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucune question. Ajoutez-en une pour commencer.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question, qIndex) => (
                      <Card key={question.id} className="bg-[#1C1C1C] border-border/50">
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-start gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground mt-2.5 flex-shrink-0" />
                            <Badge variant="outline" className="mt-1.5 flex-shrink-0">
                              Q{qIndex + 1}
                            </Badge>
                            <Input
                              value={question.question}
                              onChange={(e) =>
                                handleUpdateQuestion(question.id, e.target.value)
                              }
                              onBlur={(e) =>
                                handleUpdateQuestion(question.id, e.target.value)
                              }
                              className="bg-[#141414] flex-1"
                              placeholder="Texte de la question"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive flex-shrink-0"
                              onClick={() => handleDeleteQuestion(question.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          {/* Options */}
                          <div className="ml-12 space-y-2">
                            <Label className="text-xs text-muted-foreground">
                              Options (cliquez sur le cercle pour marquer la bonne réponse)
                            </Label>
                            {question.options.map((option) => (
                              <div key={option.id} className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleToggleCorrect(question.id, option.id)
                                  }
                                  className="flex-shrink-0"
                                  title={
                                    option.is_correct
                                      ? "Bonne réponse"
                                      : "Marquer comme bonne réponse"
                                  }
                                >
                                  {option.is_correct ? (
                                    <CheckCircle className="h-5 w-5 text-neon" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                                  )}
                                </button>
                                <Input
                                  value={option.option_text}
                                  onChange={(e) =>
                                    handleUpdateOption(
                                      question.id,
                                      option.id,
                                      e.target.value
                                    )
                                  }
                                  onBlur={(e) =>
                                    handleUpdateOption(
                                      question.id,
                                      option.id,
                                      e.target.value
                                    )
                                  }
                                  className={cn(
                                    "bg-[#141414] flex-1 text-sm",
                                    option.is_correct && "border-neon/30"
                                  )}
                                  placeholder="Texte de l'option"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                                  onClick={() =>
                                    handleDeleteOption(question.id, option.id)
                                  }
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-muted-foreground"
                              onClick={() => handleAddOption(question.id)}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Ajouter une option
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
