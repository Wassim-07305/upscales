"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useAuth } from "./use-auth";
import { toast } from "sonner";

// ── Types ──

export interface QuizOption {
  id: string;
  text: string;
  score: number;
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: "single_choice";
  options: QuizOption[];
}

export interface QuizResult {
  min: number;
  max: number;
  title: string;
  description: string;
  emoji: string;
}

export interface LeadQuiz {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  questions: QuizQuestion[];
  results: QuizResult[];
  cta_text: string | null;
  cta_url: string | null;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface LeadQuizSubmission {
  id: string;
  quiz_id: string;
  answers: Record<string, string>;
  score: number;
  max_score: number;
  result_index: number;
  email: string | null;
  profile_id: string | null;
  created_at: string;
}

// ── Queries ──

/** Liste tous les quizzes (admin) */
export function useLeadQuizzes() {
  const supabase = useSupabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["lead-quizzes"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quizzes" as never)
        .select("*, quiz_submissions(count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (LeadQuiz & {
        quiz_submissions: Array<{ count: number }>;
      })[];
    },
  });
}

/** Quiz par ID */
export function useLeadQuiz(id: string | undefined) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["lead-quiz", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quizzes" as never)
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as LeadQuiz;
    },
  });
}

/** Quiz public par slug (publie uniquement) */
export function useLeadQuizBySlug(slug: string | undefined) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["lead-quiz-slug", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quizzes" as never)
        .select("*")
        .eq("slug", slug!)
        .eq("is_published", true)
        .single();
      if (error) throw error;
      return data as LeadQuiz;
    },
  });
}

/** Submissions d'un quiz (admin) */
export function useLeadQuizSubmissions(quizId: string | undefined) {
  const supabase = useSupabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["lead-quiz-submissions", quizId],
    enabled: !!quizId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_submissions" as never)
        .select("*")
        .eq("quiz_id", quizId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LeadQuizSubmission[];
    },
  });
}

// ── Mutations ──

/** Creer un quiz */
export function useCreateLeadQuiz() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      quiz: Omit<LeadQuiz, "id" | "created_at" | "updated_at">,
    ) => {
      const { data, error } = await supabase
        .from("quizzes" as never)
        .insert(quiz as never)
        .select()
        .single();
      if (error) throw error;
      return data as LeadQuiz;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-quizzes"] });
      toast.success("Quiz cree !");
    },
    onError: () => {
      toast.error("Erreur lors de la creation du quiz");
    },
  });
}

/** Mettre a jour un quiz */
export function useUpdateLeadQuiz() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string } & Partial<
      Omit<LeadQuiz, "id" | "created_at" | "updated_at">
    >) => {
      const { data, error } = await supabase
        .from("quizzes" as never)
        .update(updates as never)
        .eq("id", id as never)
        .select()
        .single();
      if (error) throw error;
      return data as LeadQuiz;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lead-quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["lead-quiz", variables.id] });
      toast.success("Quiz mis a jour !");
    },
    onError: () => {
      toast.error("Erreur lors de la mise a jour du quiz");
    },
  });
}

/** Supprimer un quiz */
export function useDeleteLeadQuiz() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("quizzes" as never)
        .delete()
        .eq("id", id as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-quizzes"] });
      toast.success("Quiz supprime !");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression du quiz");
    },
  });
}

/** Soumettre un quiz (public, pas d'auth requise) */
export function useSubmitLeadQuiz() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submission: {
      quiz_id: string;
      answers: Record<string, string>;
      score: number;
      max_score: number;
      result_index: number;
      email?: string;
      profile_id?: string;
    }) => {
      const { data, error } = await supabase
        .from("quiz_submissions" as never)
        .insert(submission as never)
        .select()
        .single();
      if (error) throw error;
      return data as LeadQuizSubmission;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["lead-quiz-submissions", variables.quiz_id],
      });
    },
    onError: () => {
      toast.error("Erreur lors de la soumission du quiz");
    },
  });
}
