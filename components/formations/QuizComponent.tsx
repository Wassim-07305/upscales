"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Quiz, QuizQuestion, QuizOption } from "@/lib/types/database";

interface QuizComponentProps {
  quiz: Quiz;
  questions: (QuizQuestion & { options: QuizOption[] })[];
  onComplete?: (passed: boolean) => void;
}

export function QuizComponent({ quiz, questions, onComplete }: QuizComponentProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSelect = (questionId: string, optionId: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) return;

    setLoading(true);

    let correct = 0;
    questions.forEach((q) => {
      const selectedOption = q.options.find((o) => o.id === answers[q.id]);
      if (selectedOption?.is_correct) correct++;
    });

    const calcScore = Math.round((correct / questions.length) * 100);
    const hasPassed = calcScore >= quiz.passing_score;

    setScore(calcScore);
    setPassed(hasPassed);
    setSubmitted(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("quiz_attempts").insert({
        quiz_id: quiz.id,
        user_id: user.id,
        score: calcScore,
        passed: hasPassed,
        answers,
      });
    }

    onComplete?.(hasPassed);
    setLoading(false);
  };

  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{quiz.title}</h2>
        <Badge variant="outline">Score requis : {quiz.passing_score}%</Badge>
      </div>

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

      <div className="space-y-4">
        {questions.map((question, qIndex) => (
          <Card key={question.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {qIndex + 1}. {question.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {question.options.map((option) => {
                const isSelected = answers[question.id] === option.id;
                const showCorrect = submitted && option.is_correct;
                const showWrong = submitted && isSelected && !option.is_correct;

                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(question.id, option.id)}
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
                    <span>{option.option_text}</span>
                    {showCorrect && <CheckCircle className="h-4 w-4 text-neon ml-auto" />}
                    {showWrong && <XCircle className="h-4 w-4 text-destructive ml-auto" />}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {!submitted && (
        <Button onClick={handleSubmit} disabled={!allAnswered || loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Soumettre le quiz
        </Button>
      )}
    </div>
  );
}
