"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useAuth } from "./use-auth";
import { toast } from "sonner";
import type {
  NotificationPreferences,
  NotificationPriority,
} from "@/types/database";

/**
 * Fetch the current user's notification preferences.
 * Auto-creates a row if none exists (upsert on first access).
 */
export function useNotificationPreferences() {
  const supabase = useSupabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notification-preferences", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // Try to fetch existing preferences
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      // Auto-create if none exists
      if (!data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: created, error: createError } = await (supabase as any)
          .from("notification_preferences")
          .upsert({ user_id: user!.id })
          .select()
          .single();

        if (createError) throw createError;
        return created as NotificationPreferences;
      }

      return data as NotificationPreferences;
    },
  });
}

/**
 * Mutation to update notification preferences.
 */
export function useUpdateNotificationPreferences() {
  const supabase = useSupabase();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      updates: Partial<
        Pick<
          NotificationPreferences,
          | "quiet_hours_start"
          | "quiet_hours_end"
          | "batch_frequency"
          | "priority_threshold"
          | "email_digest"
          | "push_enabled"
        >
      >,
    ) => {
      if (!user?.id) throw new Error("Non authentifie");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("notification_preferences")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as NotificationPreferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notification-preferences", user?.id],
      });
      toast.success("Preferences mises a jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour des preferences");
    },
  });
}

/**
 * Toutes les notifications sont toujours actives pour tout le monde.
 * Pas de filtrage par priorite, heures silencieuses ou batch.
 */
export function useShouldShowNotification() {
  return (_priority: NotificationPriority): boolean => true;
}
