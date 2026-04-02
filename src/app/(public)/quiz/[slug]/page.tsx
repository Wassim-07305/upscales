"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Quiz, QuizQuestion, QuizResult } from "@/types/database";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Mail,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Supabase client (anon key — no auth required)
// ---------------------------------------------------------------------------
const supabase = createClient();

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export default function QuizPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quiz state
  const [currentStep, setCurrentStep] = useState(0); // 0-indexed question index
  const [answers, setAnswers] = useState<Record<string, number>>({}); // question_id -> option index
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Email capture
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // Direction for slide animation
  const [direction, setDirection] = useState(1);

  // Fetch quiz by slug
  useEffect(() => {
    async function fetchQuiz() {
      const { data, error: fetchError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (fetchError || !data) {
        setError("Quiz introuvable ou non publie.");
      } else {
        setQuiz(data as Quiz);
      }
      setLoading(false);
    }
    fetchQuiz();
  }, [slug]);

  // Derived values
  const questions: QuizQuestion[] = quiz?.questions ?? [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentStep] ?? null;
  const progress =
    totalQuestions > 0
      ? ((currentStep + (finished ? 1 : 0)) / totalQuestions) * 100
      : 0;

  // Calculate score
  const { score, maxScore, percentage, matchedResult } = useMemo(() => {
    if (!quiz || !finished)
      return {
        score: 0,
        maxScore: 0,
        percentage: 0,
        matchedResult: null as QuizResult | null,
      };

    let s = 0;
    let ms = 0;
    for (const q of questions) {
      const selectedIdx = answers[q.id];
      if (selectedIdx !== undefined && q.options[selectedIdx]) {
        s += q.options[selectedIdx].score;
      }
      // max score per question = highest option score
      const maxOpt = Math.max(...q.options.map((o) => o.score));
      ms += maxOpt;
    }

    const pct = ms > 0 ? Math.round((s / ms) * 100) : 0;

    // Find matching result
    const results: QuizResult[] = quiz.results ?? [];
    const matched =
      results.find((r) => s >= r.min_score && s <= r.max_score) ??
      results[results.length - 1] ??
      null;

    return { score: s, maxScore: ms, percentage: pct, matchedResult: matched };
  }, [quiz, finished, answers, questions]);

  // Handlers
  const selectOption = (optionIndex: number) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIndex }));

    // Auto-advance after short delay
    setTimeout(() => {
      if (currentStep < totalQuestions - 1) {
        setDirection(1);
        setCurrentStep((s) => s + 1);
      } else {
        setFinished(true);
        submitAnswers(optionIndex);
      }
    }, 400);
  };

  const goBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  };

  const submitAnswers = async (lastOptionIdx?: number) => {
    if (!quiz || submitted) return;
    setSubmitting(true);

    // Recompute score with the last answer included
    let s = 0;
    let ms = 0;
    const finalAnswers = { ...answers };
    if (lastOptionIdx !== undefined && currentQuestion) {
      finalAnswers[currentQuestion.id] = lastOptionIdx;
    }
    for (const q of questions) {
      const idx = finalAnswers[q.id];
      if (idx !== undefined && q.options[idx]) {
        s += q.options[idx].score;
      }
      ms += Math.max(...q.options.map((o) => o.score));
    }

    const results: QuizResult[] = quiz.results ?? [];
    const rIdx = results.findIndex((r) => s >= r.min_score && s <= r.max_score);

    await supabase.from("quiz_submissions").insert({
      quiz_id: quiz.id,
      answers: finalAnswers,
      score: s,
      max_score: ms,
      result_index: rIdx >= 0 ? rIdx : null,
    });

    setSubmitted(true);
    setSubmitting(false);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !quiz) return;

    // Update the latest submission with the email
    await supabase
      .from("quiz_submissions")
      .update({ email })
      .eq("quiz_id", quiz.id)
      .order("created_at", { ascending: false })
      .limit(1);

    setEmailSent(true);
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0C0A09] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#c6ff00] animate-spin" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------
  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-[#0C0A09] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-lime-400/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-lime-300" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">
            Quiz introuvable
          </h1>
          <p className="text-white/40 text-sm">
            Ce quiz n&apos;existe pas ou n&apos;est pas encore publie.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Results screen
  // ---------------------------------------------------------------------------
  if (finished) {
    return (
      <div className="min-h-screen bg-[#0C0A09] flex items-center justify-center px-4 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
          }}
          className="w-full max-w-lg mx-auto"
        >
          {/* Score circle */}
          <motion.div variants={fadeUp} className="flex justify-center mb-8">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#c6ff00"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 54}
                  initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                  animate={{
                    strokeDashoffset: 2 * Math.PI * 54 * (1 - percentage / 100),
                  }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  className="text-3xl font-bold text-white font-display"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {percentage}%
                </motion.span>
                <span className="text-xs text-white/40 mt-0.5">
                  {score}/{maxScore} pts
                </span>
              </div>
            </div>
          </motion.div>

          {/* Result card */}
          {matchedResult && (
            <motion.div
              variants={fadeUp}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 mb-6 text-center backdrop-blur-xl"
              style={{
                boxShadow:
                  "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
              }}
            >
              <span className="text-4xl mb-3 block">{matchedResult.emoji}</span>
              <h2 className="text-xl font-display font-bold text-white mb-2">
                {matchedResult.title}
              </h2>
              <p className="text-white/50 text-sm leading-relaxed">
                {matchedResult.description}
              </p>
            </motion.div>
          )}

          {/* Email capture */}
          <motion.div variants={fadeUp} className="mb-6">
            {!emailSent ? (
              <form
                onSubmit={handleEmailSubmit}
                className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-4 h-4 text-[#c6ff00]" />
                  <span className="text-sm font-medium text-white">
                    Recois ton diagnostic complet par email
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ton@email.com"
                    required
                    className="flex-1 h-10 px-4 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#c6ff00]/40 focus:border-[#c6ff00]/40 transition-all text-sm"
                  />
                  <button
                    type="submit"
                    className="h-10 px-4 bg-[#c6ff00] hover:bg-[#8f0000] text-white rounded-xl text-sm font-medium transition-colors shrink-0"
                  >
                    Envoyer
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-sm text-white/70">
                  C&apos;est note ! Tu recevras ton diagnostic complet tres
                  bientot.
                </span>
              </div>
            )}
          </motion.div>

          {/* CTA */}
          <motion.div variants={fadeUp} className="text-center">
            <a
              href={quiz.cta_url}
              className="inline-flex items-center gap-2 h-12 px-8 bg-[#c6ff00] hover:bg-[#8f0000] text-white rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
              style={{
                boxShadow:
                  "0 0 20px rgba(198, 255, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.3)",
              }}
            >
              {quiz.cta_text || "Decouvrir mon plan d'action"}
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Quiz questions screen
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0C0A09] flex flex-col">
      {/* Header / progress */}
      <div className="sticky top-0 z-10 bg-[#0C0A09]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-sm font-semibold text-white/70 truncate pr-4">
              {quiz.title}
            </h1>
            <span className="text-xs text-white/40 shrink-0">
              {currentStep + 1}/{totalQuestions}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#c6ff00] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
            {currentQuestion && (
              <motion.div
                key={currentQuestion.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.25, 0.4, 0, 1] }}
              >
                {/* Question text */}
                <h2 className="text-xl sm:text-2xl font-display font-bold text-white mb-8 text-center leading-snug">
                  {currentQuestion.text}
                </h2>

                {/* Options */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = answers[currentQuestion.id] === idx;
                    return (
                      <motion.button
                        key={idx}
                        onClick={() => selectOption(idx)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border transition-all duration-200",
                          "backdrop-blur-xl",
                          isSelected
                            ? "bg-[#c6ff00]/15 border-[#c6ff00]/50 text-white"
                            : "bg-white/[0.04] border-white/[0.08] text-white/80 hover:bg-white/[0.08] hover:border-white/[0.15]",
                        )}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                              isSelected
                                ? "bg-[#c6ff00] text-white"
                                : "bg-white/[0.08] text-white/50",
                            )}
                          >
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className="text-sm font-medium">
                            {option.text}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-[#c6ff00] ml-auto shrink-0" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={goBack}
              disabled={currentStep === 0}
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium transition-colors",
                currentStep === 0
                  ? "text-white/20 cursor-not-allowed"
                  : "text-white/50 hover:text-white",
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Precedent
            </button>

            {answers[currentQuestion?.id ?? ""] !== undefined &&
              currentStep < totalQuestions - 1 && (
                <button
                  onClick={() => {
                    setDirection(1);
                    setCurrentStep((s) => s + 1);
                  }}
                  className="flex items-center gap-1.5 text-sm font-medium text-[#c6ff00] hover:text-[#cf2020] transition-colors"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
          </div>
        </div>
      </div>

      {/* Quiz description (only on first question) */}
      {currentStep === 0 && quiz.description && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center px-4 pb-6"
        >
          <p className="text-xs text-white/30 max-w-sm mx-auto">
            {quiz.description}
          </p>
        </motion.div>
      )}

      {/* Submitting overlay */}
      {submitting && (
        <div className="fixed inset-0 bg-[#0C0A09]/80 flex items-center justify-center z-50">
          <Loader2 className="w-8 h-8 text-[#c6ff00] animate-spin" />
        </div>
      )}
    </div>
  );
}
