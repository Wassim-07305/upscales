"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  staggerContainer,
  fadeInUp,
  defaultTransition,
} from "@/lib/animations";
import { cn, formatDate } from "@/lib/utils";
import { copyLink } from "@/lib/clipboard";
import { useAuth } from "@/hooks/use-auth";
import {
  useLeadQuizzes,
  useCreateLeadQuiz,
  useUpdateLeadQuiz,
  useDeleteLeadQuiz,
  useLeadQuizSubmissions,
  type QuizQuestion,
  type QuizOption,
  type QuizResult,
  type LeadQuiz,
} from "@/hooks/use-lead-quizzes";
import { toast } from "sonner";
import {
  Sparkles,
  Plus,
  BarChart2,
  Calendar,
  Link2,
  ExternalLink,
  Trash2,
  Eye,
  EyeOff,
  X,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Copy,
  Users,
} from "lucide-react";

// ── Helpers ──

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyQuestion(): QuizQuestion {
  return {
    id: generateId(),
    text: "",
    type: "single_choice",
    options: [
      { id: generateId(), text: "", score: 0 },
      { id: generateId(), text: "", score: 0 },
    ],
  };
}

function emptyResult(): QuizResult {
  return { min: 0, max: 100, title: "", description: "", emoji: "" };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ── Submissions Drawer ──

function SubmissionsDrawer({
  quizId,
  quiz,
  onClose,
}: {
  quizId: string;
  quiz: LeadQuiz;
  onClose: () => void;
}) {
  const { data: submissions, isLoading } = useLeadQuizSubmissions(quizId);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface border-l border-border shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-surface border-b border-border p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-foreground">Soumissions</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {submissions?.length ?? 0} reponse
              {(submissions?.length ?? 0) !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-muted/30 rounded-xl p-4 animate-pulse space-y-2"
              >
                <div className="h-4 w-1/3 bg-muted rounded" />
                <div className="h-3 w-2/3 bg-muted rounded" />
              </div>
            ))
          ) : !submissions || submissions.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Aucune soumission</p>
            </div>
          ) : (
            submissions.map((sub) => {
              const result = quiz.results[sub.result_index];
              return (
                <div
                  key={sub.id}
                  className="bg-muted/20 border border-border rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {sub.email ?? "Anonyme"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(sub.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium bg-[#c6ff00]/10 text-[#c6ff00] px-2 py-0.5 rounded-md">
                      {sub.score}/{sub.max_score} pts
                    </span>
                    {result && (
                      <span className="text-xs text-muted-foreground">
                        {result.emoji} {result.title}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── Question Editor ──

function QuestionEditor({
  question,
  index,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  question: QuizQuestion;
  index: number;
  onChange: (q: QuizQuestion) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const updateOption = (optIndex: number, updates: Partial<QuizOption>) => {
    const newOptions = [...question.options];
    newOptions[optIndex] = { ...newOptions[optIndex], ...updates };
    onChange({ ...question, options: newOptions });
  };

  const addOption = () => {
    onChange({
      ...question,
      options: [...question.options, { id: generateId(), text: "", score: 0 }],
    });
  };

  const removeOption = (optIndex: number) => {
    if (question.options.length <= 2) return;
    onChange({
      ...question,
      options: question.options.filter((_, i) => i !== optIndex),
    });
  };

  return (
    <div className="bg-muted/20 border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
        <span className="text-xs font-bold text-muted-foreground shrink-0">
          Q{index + 1}
        </span>
        <input
          value={question.text}
          onChange={(e) => onChange({ ...question, text: e.target.value })}
          placeholder="Texte de la question..."
          className="flex-1 h-8 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6ff00]/30"
        />
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRemove}
            className="p-1 rounded hover:bg-lime-50 text-muted-foreground hover:text-lime-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="pl-6 space-y-2">
        {question.options.map((opt, oi) => (
          <div key={opt.id} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-4 text-center shrink-0">
              {String.fromCharCode(65 + oi)}
            </span>
            <input
              value={opt.text}
              onChange={(e) => updateOption(oi, { text: e.target.value })}
              placeholder={`Option ${String.fromCharCode(65 + oi)}...`}
              className="flex-1 h-7 px-2.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6ff00]/30"
            />
            <input
              type="number"
              value={opt.score}
              onChange={(e) =>
                updateOption(oi, { score: Number(e.target.value) })
              }
              className="w-16 h-7 px-2 text-xs text-center bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6ff00]/30"
              placeholder="pts"
            />
            <button
              onClick={() => removeOption(oi)}
              disabled={question.options.length <= 2}
              className="p-1 rounded hover:bg-lime-50 text-muted-foreground hover:text-lime-400 disabled:opacity-30 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          onClick={addOption}
          className="text-xs text-[#c6ff00] hover:text-[#a3d600] font-medium transition-colors"
        >
          + Ajouter une option
        </button>
      </div>
    </div>
  );
}

// ── Result Editor ──

function ResultEditor({
  result,
  index,
  onChange,
  onRemove,
}: {
  result: QuizResult;
  index: number;
  onChange: (r: QuizResult) => void;
  onRemove: () => void;
}) {
  return (
    <div className="bg-muted/20 border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground">
          Resultat {index + 1}
        </span>
        <button
          onClick={onRemove}
          className="p-1 rounded hover:bg-lime-50 text-muted-foreground hover:text-lime-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block">
            Score min
          </label>
          <input
            type="number"
            value={result.min}
            onChange={(e) =>
              onChange({ ...result, min: Number(e.target.value) })
            }
            className="w-full h-7 px-2.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6ff00]/30"
          />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block">
            Score max
          </label>
          <input
            type="number"
            value={result.max}
            onChange={(e) =>
              onChange({ ...result, max: Number(e.target.value) })
            }
            className="w-full h-7 px-2.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6ff00]/30"
          />
        </div>
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block">
            Emoji
          </label>
          <input
            value={result.emoji}
            onChange={(e) => onChange({ ...result, emoji: e.target.value })}
            className="w-14 h-7 px-2 text-sm text-center bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6ff00]/30"
            placeholder="🏆"
          />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block">
            Titre
          </label>
          <input
            value={result.title}
            onChange={(e) => onChange({ ...result, title: e.target.value })}
            className="w-full h-7 px-2.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6ff00]/30"
            placeholder="Ex: Expert"
          />
        </div>
      </div>
      <div>
        <label className="text-[11px] text-muted-foreground mb-1 block">
          Description
        </label>
        <textarea
          value={result.description}
          onChange={(e) => onChange({ ...result, description: e.target.value })}
          rows={2}
          className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6ff00]/30 resize-none"
          placeholder="Message affiche pour ce resultat..."
        />
      </div>
    </div>
  );
}

// ── Quiz Editor Modal ──

function QuizEditorModal({
  quiz,
  onClose,
}: {
  quiz?: LeadQuiz;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const createQuiz = useCreateLeadQuiz();
  const updateQuiz = useUpdateLeadQuiz();

  const [title, setTitle] = useState(quiz?.title ?? "");
  const [description, setDescription] = useState(quiz?.description ?? "");
  const [slug, setSlug] = useState(quiz?.slug ?? "");
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    quiz?.questions ?? [emptyQuestion()],
  );
  const [results, setResults] = useState<QuizResult[]>(
    quiz?.results ?? [emptyResult()],
  );
  const [ctaText, setCtaText] = useState(quiz?.cta_text ?? "");
  const [ctaUrl, setCtaUrl] = useState(quiz?.cta_url ?? "");
  const [isPublished, setIsPublished] = useState(quiz?.is_published ?? false);
  const [autoSlug, setAutoSlug] = useState(!quiz);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (autoSlug) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setAutoSlug(false);
    setSlug(slugify(val));
  };

  const updateQuestion = (index: number, q: QuizQuestion) => {
    const next = [...questions];
    next[index] = q;
    setQuestions(next);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const moveQuestion = (from: number, to: number) => {
    if (to < 0 || to >= questions.length) return;
    const next = [...questions];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setQuestions(next);
  };

  const updateResult = (index: number, r: QuizResult) => {
    const next = [...results];
    next[index] = r;
    setResults(next);
  };

  const removeResult = (index: number) => {
    if (results.length <= 1) return;
    setResults(results.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }
    if (!slug.trim()) {
      toast.error("Le slug est obligatoire");
      return;
    }
    if (questions.some((q) => !q.text.trim())) {
      toast.error("Toutes les questions doivent avoir un texte");
      return;
    }
    if (results.some((r) => !r.title.trim())) {
      toast.error("Tous les resultats doivent avoir un titre");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      slug: slug.trim(),
      questions,
      results,
      cta_text: ctaText.trim() || null,
      cta_url: ctaUrl.trim() || null,
      is_published: isPublished,
      created_by: user!.id,
    };

    if (quiz) {
      await updateQuiz.mutateAsync({ id: quiz.id, ...payload });
    } else {
      await createQuiz.mutateAsync(payload);
    }
    onClose();
  };

  const isSaving = createQuiz.isPending || updateQuiz.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl mx-4">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border rounded-t-2xl p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-foreground">
            {quiz ? "Modifier le quiz" : "Nouveau quiz"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {/* Infos generales */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">
              Informations generales
            </h3>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Titre
              </label>
              <input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c6ff00]/30"
                placeholder="Ex: Es-tu pret a scaler ton business ?"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c6ff00]/30 resize-none"
                placeholder="Description courte du quiz..."
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Slug (URL publique)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">
                  /quiz/
                </span>
                <input
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="flex-1 h-8 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6ff00]/30"
                  placeholder="mon-quiz"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPublished(!isPublished)}
                className={cn(
                  "h-8 px-3 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5",
                  isPublished
                    ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {isPublished ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
                {isPublished ? "Publie" : "Brouillon"}
              </button>
            </div>
          </section>

          {/* Questions */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                Questions ({questions.length})
              </h3>
              <button
                onClick={() => setQuestions([...questions, emptyQuestion()])}
                className="h-7 px-2.5 rounded-lg text-xs font-medium text-[#c6ff00] hover:bg-[#c6ff00]/5 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter
              </button>
            </div>
            <div className="space-y-3">
              {questions.map((q, i) => (
                <QuestionEditor
                  key={q.id}
                  question={q}
                  index={i}
                  onChange={(updated) => updateQuestion(i, updated)}
                  onRemove={() => removeQuestion(i)}
                  onMoveUp={() => moveQuestion(i, i - 1)}
                  onMoveDown={() => moveQuestion(i, i + 1)}
                  isFirst={i === 0}
                  isLast={i === questions.length - 1}
                />
              ))}
            </div>
          </section>

          {/* Resultats */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                Resultats ({results.length})
              </h3>
              <button
                onClick={() => setResults([...results, emptyResult()])}
                className="h-7 px-2.5 rounded-lg text-xs font-medium text-[#c6ff00] hover:bg-[#c6ff00]/5 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter
              </button>
            </div>
            <div className="space-y-3">
              {results.map((r, i) => (
                <ResultEditor
                  key={i}
                  result={r}
                  index={i}
                  onChange={(updated) => updateResult(i, updated)}
                  onRemove={() => removeResult(i)}
                />
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">
              Call-to-action
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Texte du bouton
                </label>
                <input
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  className="w-full h-8 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6ff00]/30"
                  placeholder="Ex: Reserver un appel"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  URL du bouton
                </label>
                <input
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  className="w-full h-8 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6ff00]/30"
                  placeholder="https://..."
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-surface border-t border-border rounded-b-2xl p-4 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="h-9 px-5 rounded-xl bg-gradient-to-r from-[#c6ff00] to-[#c6ff00] text-white text-sm font-semibold hover:from-[#a3d600] hover:to-[#a3d600] transition-all active:scale-[0.98] shadow-sm shadow-lime-400/20 disabled:opacity-50"
          >
            {isSaving
              ? "Enregistrement..."
              : quiz
                ? "Enregistrer"
                : "Creer le quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──

export default function AdminQuizzesPage() {
  const { data: quizzes, isLoading } = useLeadQuizzes();
  const deleteQuiz = useDeleteLeadQuiz();
  const [editorQuiz, setEditorQuiz] = useState<LeadQuiz | undefined>(undefined);
  const [showEditor, setShowEditor] = useState(false);
  const [submissionsQuizId, setSubmissionsQuizId] = useState<string | null>(
    null,
  );

  const getPublicUrl = useCallback((slug: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/quiz/${slug}`;
    }
    return `/quiz/${slug}`;
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce quiz ? Cette action est irreversible.")) return;
    await deleteQuiz.mutateAsync(id);
  };

  const submissionsQuiz = quizzes?.find((q) => q.id === submissionsQuizId);

  return (
    <>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          transition={defaultTransition}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Quiz
            </h1>
            <p className="text-sm text-muted-foreground/80 mt-1.5 leading-relaxed">
              {quizzes?.length ?? 0} quiz
              {(quizzes?.length ?? 0) !== 1 ? "zes" : ""}
              {" — "}lead magnets et diagnostics
            </p>
          </div>
          <button
            onClick={() => {
              setEditorQuiz(undefined);
              setShowEditor(true);
            }}
            className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#c6ff00] to-[#c6ff00] text-white text-sm font-semibold hover:from-[#a3d600] hover:to-[#a3d600] transition-all active:scale-[0.98] shadow-sm shadow-lime-400/20 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau quiz
          </button>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={fadeInUp}
          transition={defaultTransition}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface border border-border rounded-xl p-5 animate-pulse space-y-3"
              >
                <div className="h-4 w-2/3 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            ))
          ) : !quizzes || quizzes.length === 0 ? (
            <div className="col-span-full py-16 text-center">
              <Sparkles className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Aucun quiz</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Cree ton premier quiz pour generer des leads
              </p>
            </div>
          ) : (
            quizzes.map((quiz) => {
              const submissionCount = quiz.quiz_submissions?.[0]?.count ?? 0;
              const isPublished = quiz.is_published;

              return (
                <div
                  key={quiz.id}
                  className="bg-surface border border-border rounded-xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c6ff00]/10 to-[#c6ff00]/5 flex items-center justify-center ring-1 ring-[#c6ff00]/10">
                      <Sparkles className="w-5 h-5 text-[#c6ff00]" />
                    </div>
                    <span
                      className={cn(
                        "text-[11px] font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1.5",
                        isPublished
                          ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20"
                          : "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200",
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          isPublished ? "bg-emerald-500" : "bg-zinc-400",
                        )}
                      />
                      {isPublished ? "Publie" : "Brouillon"}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setEditorQuiz(quiz);
                      setShowEditor(true);
                    }}
                    className="text-left w-full"
                  >
                    <h3 className="text-sm font-bold text-foreground group-hover:text-[#c6ff00] transition-colors tracking-tight">
                      {quiz.title}
                    </h3>
                    {quiz.description && (
                      <p className="text-xs text-muted-foreground/80 mt-1.5 line-clamp-2 leading-relaxed">
                        {quiz.description}
                      </p>
                    )}
                  </button>

                  <div className="flex items-center gap-3 mt-3.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-md">
                      <BarChart2 className="w-3.5 h-3.5" />
                      {submissionCount} reponse
                      {submissionCount !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(quiz.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mt-3.5 pt-3.5 border-t border-border/50 flex-wrap">
                    <button
                      onClick={() => copyLink(getPublicUrl(quiz.slug))}
                      className="h-7 px-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center gap-1.5"
                    >
                      <Link2 className="w-3 h-3" />
                      Copier le lien
                    </button>
                    {isPublished && (
                      <a
                        href={`/quiz/${quiz.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-7 px-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Ouvrir
                      </a>
                    )}
                    <button
                      onClick={() => setSubmissionsQuizId(quiz.id)}
                      className="h-7 px-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center gap-1.5"
                    >
                      <Users className="w-3 h-3" />
                      Soumissions
                    </button>
                    <button
                      onClick={() => handleDelete(quiz.id)}
                      className="h-7 px-2.5 rounded-lg text-xs text-muted-foreground hover:text-lime-400 hover:bg-lime-50 transition-all flex items-center gap-1.5 ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </motion.div>
      </motion.div>

      {/* Editor Modal */}
      {showEditor && (
        <QuizEditorModal
          quiz={editorQuiz}
          onClose={() => setShowEditor(false)}
        />
      )}

      {/* Submissions Drawer */}
      {submissionsQuizId && submissionsQuiz && (
        <SubmissionsDrawer
          quizId={submissionsQuizId}
          quiz={submissionsQuiz}
          onClose={() => setSubmissionsQuizId(null)}
        />
      )}
    </>
  );
}
