"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Star,
  ChevronDown,
  ChevronUp,
  Paperclip,
  RotateCcw,
  CheckCircle,
  Clock,
  User,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExerciseSubmission, SubmissionStatus } from "@/lib/exercises/exercise-types";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Brouillon", color: "bg-white/10 text-white/60", icon: <FileText className="w-3.5 h-3.5" /> },
  submitted: { label: "A corriger", color: "bg-amber-500/20 text-amber-400", icon: <Clock className="w-3.5 h-3.5" /> },
  pending: { label: "A corriger", color: "bg-amber-500/20 text-amber-400", icon: <Clock className="w-3.5 h-3.5" /> },
  reviewed: { label: "Corrige", color: "bg-emerald-500/20 text-emerald-400", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  revision_requested: { label: "En revision", color: "bg-blue-500/20 text-blue-400", icon: <RotateCcw className="w-3.5 h-3.5" /> },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface Props {
  submissions: ExerciseSubmission[];
  coachName?: string;
  onGrade?: (id: string, grade: number, feedback: string) => void;
  onRequestRevision?: (id: string, feedback: string) => void;
}

type FilterTab = "all" | "submitted" | "reviewed" | "revision_requested";

export default function ExerciseSubmissionDashboard({
  submissions: initialSubmissions,
  coachName = "Coach",
  onGrade,
  onRequestRevision,
}: Props) {
  const [submissions, setSubmissions] = useState<ExerciseSubmission[]>(initialSubmissions);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState<number>(75);
  const [feedbackInput, setFeedbackInput] = useState("");

  const filtered = useMemo(() => {
    if (activeTab === "all") return submissions;
    return submissions.filter((s) => s.status === activeTab);
  }, [submissions, activeTab]);

  const pendingCount = useMemo(() => submissions.filter((s) => s.status === "submitted").length, [submissions]);
  const avgGrade = useMemo(() => {
    const graded = submissions.filter((s) => s.grade !== null);
    if (graded.length === 0) return 0;
    return Math.round(graded.reduce((sum, s) => sum + (s.grade ?? 0), 0) / graded.length);
  }, [submissions]);

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: "all", label: "Tous" },
    { key: "submitted", label: "A corriger", count: pendingCount },
    { key: "reviewed", label: "Corriges" },
    { key: "revision_requested", label: "En revision" },
  ];

  function handleGrade(id: string, action: "validate" | "revision") {
    const feedback = feedbackInput || (action === "validate" ? "Bon travail." : "Veuillez approfondir votre analyse.");
    const now = new Date().toISOString();

    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (action === "validate") {
          onGrade?.(id, gradeInput, feedback);
          return { ...s, status: "reviewed" as SubmissionStatus, grade: gradeInput, coachFeedback: feedback, reviewedBy: coachName, reviewedAt: now };
        }
        onRequestRevision?.(id, feedback);
        return { ...s, status: "revision_requested" as SubmissionStatus, coachFeedback: feedback, reviewedBy: coachName, reviewedAt: now };
      })
    );
    setGradingId(null);
    setFeedbackInput("");
    setGradeInput(75);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Corrections d&apos;exercices</h2>
        <p className="text-muted-foreground mt-1">Gerez et corrigez les soumissions de vos eleves</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Soumissions", value: submissions.length, icon: <FileText className="w-5 h-5 text-muted-foreground" /> },
          { label: "Note moyenne", value: `${avgGrade}/100`, icon: <Star className="w-5 h-5 text-amber-400" /> },
          { label: "En attente", value: pendingCount, icon: <Clock className="w-5 h-5 text-amber-400" /> },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#111] border border-border rounded-xl p-4 flex items-center gap-3">
            {stat.icon}
            <div>
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-[#111] rounded-xl p-1 border border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.key ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Submissions List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((sub) => {
            const config = statusConfig[sub.status];
            const isExpanded = expandedId === sub.id;
            const isGrading = gradingId === sub.id;

            return (
              <motion.div
                key={sub.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-[#111] border border-border rounded-xl overflow-hidden"
              >
                <div
                  className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#222] border border-border flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{sub.studentName}</span>
                          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", config.color)}>
                            {config.icon}
                            {config.label}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5">{sub.lessonTitle}</div>
                        <div className="text-xs text-muted-foreground/60 mt-1">Soumis le {formatDate(sub.submittedAt)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {sub.grade !== null && (
                        <div className="flex items-center gap-1 text-amber-400">
                          <Star className="w-4 h-4 fill-amber-400" />
                          <span className="text-sm font-bold">{sub.grade}/100</span>
                        </div>
                      )}
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Contenu</div>
                          <p className="text-sm leading-relaxed">{sub.content}</p>
                        </div>

                        {sub.attachments.length > 0 && (
                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                              Pieces jointes ({sub.attachments.length})
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {sub.attachments.map((att, i) => (
                                <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] border border-border rounded-lg text-xs text-muted-foreground">
                                  <Paperclip className="w-3 h-3" />
                                  {att.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {sub.coachFeedback && (
                          <div className="bg-[#1a1a1a] border border-border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                Feedback — {sub.reviewedBy}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{sub.coachFeedback}</p>
                          </div>
                        )}

                        {sub.status === "submitted" && (
                          <>
                            {!isGrading ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); setGradingId(sub.id); }}
                                className="w-full py-2.5 bg-accent/50 hover:bg-accent border border-border rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                              >
                                <Star className="w-4 h-4" />
                                Corriger cet exercice
                              </button>
                            ) : (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[#1a1a1a] border border-border rounded-xl p-4 space-y-4"
                              >
                                <div className="text-sm font-medium">Correction</div>
                                <div>
                                  <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                                    Note ({gradeInput}/100)
                                  </label>
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={gradeInput}
                                    onChange={(e) => setGradeInput(Number(e.target.value))}
                                    className="w-full accent-neon"
                                  />
                                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <span>0</span>
                                    <span className={cn("font-bold text-sm", gradeInput >= 80 ? "text-emerald-400" : gradeInput >= 50 ? "text-amber-400" : "text-red-400")}>
                                      {gradeInput}
                                    </span>
                                    <span>100</span>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">Feedback</label>
                                  <textarea
                                    value={feedbackInput}
                                    onChange={(e) => setFeedbackInput(e.target.value)}
                                    placeholder="Votre feedback pour l'eleve..."
                                    rows={3}
                                    className="w-full bg-[#222] border border-border rounded-lg px-3 py-2 text-sm placeholder-muted-foreground resize-none focus:outline-none focus:border-primary"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleGrade(sub.id, "validate"); }}
                                    className="flex-1 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Valider
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleGrade(sub.id, "revision"); }}
                                    className="flex-1 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                    Demander revision
                                  </button>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setGradingId(null); }}
                                  className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  Annuler
                                </button>
                              </motion.div>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Aucune soumission dans cette categorie</p>
          </div>
        )}
      </div>
    </div>
  );
}
