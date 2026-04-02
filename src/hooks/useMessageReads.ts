import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export function useMarkChannelRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channelId: string) => {
      const { error } = await supabase.rpc("mark_channel_read", {
        p_channel_id: channelId,
      } as never);
      if (error) throw error;
      return channelId;
    },
    onSuccess: (channelId) => {
      // Mise à jour immédiate du cache → badge à 0 sans attendre de refetch
      queryClient.setQueriesData(
        { queryKey: ["channel-unreads"], exact: false },
        (
          old: Record<string, { total: number; urgent: number }> | undefined,
        ) => {
          if (!old) return old;
          return { ...old, [channelId]: { total: 0, urgent: 0 } };
        },
      );
      // Refetch channels en arrière-plan pour mettre à jour last_read_at
      // Ne PAS invalider channel-unreads ici : ça déclencherait un refetch immédiat
      // avec le vieux last_read_at avant que channels soit à jour
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });
}
