"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Loader2, History, Lightbulb, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Quiz, QuizQuestion, QuizOption, QuizAttempt } from "@/lib/types/database";
import { timeAgo } from "@/lib/utils/dates";
import { z } from "zod";

const quizAnswersSchema = z.record(
  z.string().uuid("ID de question invalide"),
  z.string().min(1, "Réponse vide")
);

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface QuizComponentProps {
  quiz: Quiz;
  questions: (QuizQuestion & { options: QuizOption[] })[];
  onComplete?: (passed: boolean) => void;
}

export function QuizComponent({ quiz, questions: rawQuestions, onComplete }: QuizComponentProps) {
  const [questions, setQuestions] = useState(() =>
    shuffleArray(rawQuestions).map((q) => ({
      ...q,
      options: q.question_type === "multiple_choice" ? shuffleArray(q.options) : q.options,
    }))
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    quiz.time_limit_minutes ? quiz.time_limit_minutes * 60 : null
  );
  const supabase = createClient();

  // Quiz timer countdown
  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => (t !== null ? t - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, submitted]);

  useEffect(() => {
    async function fetchAttempts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("quiz_id", quiz.id)
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(10);
      if (data) setAttempts(data);
    }
    fetchAttempts();
  }, [quiz.id, submitted]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleTrueFalse = (questionId: string, value: "true" | "false") => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleFreeResponse = (questionId: string, value: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const isQuestionCorrect = (q: QuizQuestion & { options: QuizOption[] }): boolean => {
    const type = q.question_type || "multiple_choice";
    if (type === "multiple_choice") {
      return q.options.find((o) => o.id === answers[q.id])?.is_correct || false;
    }
    if (type === "true_false") {
      const correct = q.options.find((o) => o.is_correct);
      return correct?.option_text === answers[q.id];
    }
    return true;
  };

  const getCorrectAnswer = (q: QuizQuestion & { options: QuizOption[] }): string => {
    const type = q.question_type || "multiple_choice";
    if (type === "multiple_choice") {
      return q.options.find((o) => o.is_correct)?.option_text || "";
    }
    if (type === "true_false") {
      return q.options.find((o) => o.is_correct)?.option_text === "true" ? "Vrai" : "Faux";
    }
    return "";
  };

  const handleSubmit = async () => {
    const unanswered = questions.filter((q) => {
      if ((q.question_type || "multiple_choice") === "free_response") return false;
      return !answers[q.id];
    });
    if (unanswered.length > 0) return;

    setLoading(true);

    let correct = 0;
    let gradableCount = 0;

    questions.forEach((q) => {
      const type = q.question_type || "multiple_choice";
      if (type === "free_response") {
        gradableCount++;
        correct++;
      } else {
        gradableCount++;
        if (isQuestionCorrect(q)) correct++;
      }
    });

    const calcScore = gradableCount > 0 ? Math.round((correct / gradableCount) * 100) : 0;
    const hasPassed = calcScore >= quiz.passing_score;

    setScore(calcScore);
    setPassed(hasPassed);
    setSubmitted(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const parsed = quizAnswersSchema.safeParse(answers);
      if (parsed.success) {
        await supabase.from("quiz_attempts").insert({
          quiz_id: quiz.id,
          user_id: user.id,
          score: calcScore,
          passed: hasPassed,
          answers: parsed.data,
        });
      }
    }

    onComplete?.(hasPassed);
    setLoading(false);
  };

  const allAnswered = questions.every((q) => {
    if ((q.question_type || "multiple_choice") === "free_response") return true;
    return !!answers[q.id];
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{quiz.title}</h2>
        <div className="flex items-center gap-2">
          {attempts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="text-muted-foreground"
            >
              <History className="mr-1 h-4 w-4" />
              {attempts.length} tentative{attempts.length > 1 ? "s" : ""}
            </Button>
          )}
          {timeLeft !== null && !submitted && (
            <Badge
              variant="outline"
              className={cn(
                "font-mono",
                timeLeft <= 60 && "border-destructive text-destructive animate-pulse"
              )}
            >
              <Clock className="mr-1 h-3 w-3" />
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </Badge>
          )}
          <Badge variant="outline">Score requis : {quiz.passing_score}%</Badge>
        </div>
      </div>

      {/* Historique */}
      {showHistory && attempts.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Historique des tentatives</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {attempts.map((attempt, i) => (
              <div key={attempt.id} className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-muted-foreground">
                  Tentative {attempts.length - i}
                  <span className="ml-2 text-xs">{timeAgo(attempt.completed_at)}</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className={cn("font-medium", attempt.passed ? "text-neon" : "text-destructive")}>
                    {attempt.score}%
                  </span>
                  {attempt.passed ? (
                    <CheckCircle className="h-3.5 w-3.5 text-neon" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Resultat */}
      {submitted && (
        <Card className={cn("border-2", passed ? "border-neon/50 bg-neon/5" : "border-destructive/50 bg-destructive/5")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {passed ? (
                <CheckCircle className="h-8 w-8 text-neon" />
              ) : (
                <XCircle className="h-8 w-8 text-destructive" />
              )}
              <div>
                <p className="font-semibold text-lg">
                  {passed ? "Félicitations !" : "Pas tout à fait..."}
                </p>
                <p className="text-sm text-muted-foreground">
                  Score : {score}% — {passed ? "Quiz réussi !" : `Il faut ${quiz.passing_score}% pour valider`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((question, qIndex) => {
          const type = question.question_type || "multiple_choice";
          const correct = submitted ? isQuestionCorrect(question) : null;

          return (
            <Card key={question.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium flex-1">
                    {qIndex + 1}. {question.question}
                  </CardTitle>
                  {type !== "multiple_choice" && (
                    <Badge variant="outline" className="text-[10px] flex-shrink-0">
                      {type === "true_false" ? "Vrai / Faux" : "Réponse libre"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Choix multiple */}
                {type === "multiple_choice" &&
                  question.options.map((option) => {
                    const isSelected = answers[question.id] === option.id;
                    const showCorrect = submitted && option.is_correct;
                    const showWrong = submitted && isSelected && !option.is_correct;

                    return (
                      <button
                        key={option.id}
                        onClick={() => handleSelectOption(question.id, option.id)}
                        disabled={submitted}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg border text-left text-sm transition-colors",
                          isSelected && !submitted && "border-primary bg-primary/5",
                          showCorrect && "border-neon bg-neon/10",
                          showWrong && "border-destructive bg-destructive/10",
                          !isSelected && !submitted && "border-border hover:border-primary/50 hover:bg-accent/50",
                          submitted && !showCorrect && !showWrong && "opacity-50"
                        )}
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                            isSelected ? "border-primary" : "border-muted-foreground/30"
                          )}
                        >
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          {option.image_url && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={option.image_url}
                              alt={option.option_text}
                              className="max-h-32 rounded-lg mb-1 object-contain"
                            />
                          )}
                          <span>{option.option_text}</span>
                        </div>
                        {showCorrect && <CheckCircle className="h-4 w-4 text-neon ml-auto flex-shrink-0" />}
                        {showWrong && <XCircle className="h-4 w-4 text-destructive ml-auto flex-shrink-0" />}
                      </button>
                    );
                  })}

                {/* Vrai / Faux */}
                {type === "true_false" && (
                  <div className="flex gap-3">
                    {(["true", "false"] as const).map((val) => {
                      const isSelected = answers[question.id] === val;
                      const correctOption = question.options.find((o) => o.is_correct);
                      const isCorrectVal = correctOption?.option_text === val;
                      const showCorrect = submitted && isCorrectVal;
                      const showWrong = submitted && isSelected && !isCorrectVal;

                      return (
                        <button
                          key={val}
                          onClick={() => handleTrueFalse(question.id, val)}
                          disabled={submitted}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border text-sm font-medium transition-colors",
                            isSelected && !submitted && "border-primary bg-primary/5",
                            showCorrect && "border-neon bg-neon/10",
                            showWrong && "border-destructive bg-destructive/10",
                            !isSelected && !submitted && "border-border hover:border-primary/50 hover:bg-accent/50",
                            submitted && !showCorrect && !showWrong && "opacity-50"
                          )}
                        >
                          {val === "true" ? (
                            <CheckCircle className={cn("h-5 w-5", isSelected ? "text-neon" : "text-muted-foreground")} />
                          ) : (
                            <XCircle className={cn("h-5 w-5", isSelected ? "text-destructive" : "text-muted-foreground")} />
                          )}
                          {val === "true" ? "Vrai" : "Faux"}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Réponse libre */}
                {type === "free_response" && (
                  <Textarea
                    value={answers[question.id] || ""}
                    onChange={(e) => handleFreeResponse(question.id, e.target.value)}
                    disabled={submitted}
                    placeholder="Votre réponse..."
                    className="min-h-[100px] bg-muted/50 border-0"
                  />
                )}

                {/* Explication */}
                {submitted && question.explanation && (
                  <div className="flex gap-2 mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <span className="font-medium text-primary">Explication : </span>
                      <span className="text-muted-foreground">{question.explanation}</span>
                    </div>
                  </div>
                )}

                {/* Bonne réponse quand faux */}
                {submitted && correct === false && type !== "free_response" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Bonne réponse : <span className="text-neon font-medium">{getCorrectAnswer(question)}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!submitted && (
        <Button onClick={handleSubmit} disabled={!allAnswered || loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Soumettre le quiz
        </Button>
      )}

      {submitted && !passed && (
        <Button
          onClick={() => {
            setAnswers({});
            setSubmitted(false);
            setScore(0);
            setPassed(false);
            setTimeLeft(quiz.time_limit_minutes ? quiz.time_limit_minutes * 60 : null);
            // Re-shuffle questions and options on retry
            setQuestions(
              shuffleArray(rawQuestions).map((q) => ({
                ...q,
                options: q.question_type === "multiple_choice" ? shuffleArray(q.options) : q.options,
              }))
            );
          }}
          variant="outline"
          className="w-full"
        >
          Retenter le quiz
        </Button>
      )}
    </div>
  );
}
