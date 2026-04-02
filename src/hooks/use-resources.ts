"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useAuth } from "./use-auth";
import { toast } from "sonner";
import type {
  Resource,
  ResourceFolder,
  ResourceFolderAccess,
} from "@/types/database";

export function useResources(folderId?: string | null) {
  const supabase = useSupabase();
  const { user, isStaff, isAdmin } = useAuth();

  return useQuery({
    queryKey: [
      "resources",
      folderId ?? "root",
      isAdmin ? "admin" : isStaff ? "staff" : "client",
    ],
    enabled: !!user,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      let query = supabase
        .from("resources")
        .select("*, uploader:profiles!uploaded_by(id, full_name, avatar_url)")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (folderId) {
        query = query.eq("folder_id", folderId);
      } else {
        query = query.is("folder_id", null);
      }

      // Admin voit tout, staff voit staff+all, clients voient clients+all
      if (!isStaff) {
        query = query.in("visibility", ["all", "clients"]);
      } else if (!isAdmin) {
        query = query.in("visibility", ["all", "staff"]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Resource[];
    },
  });
}

export function useUploadResource() {
  const supabase = useSupabase();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      title,
      description,
      category,
      visibility,
      folderId,
    }: {
      file: File;
      title: string;
      description?: string;
      category?: string;
      visibility: "all" | "staff" | "clients";
      folderId?: string | null;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Upload file to B2 via API route
      const timestamp = Date.now();
      const storagePath = `resources/${category}/${timestamp}-${file.name}`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", storagePath);

      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");

      const { url: filePublicUrl } = await res.json();

      // Create resource record
      const { data, error } = await supabase
        .from("resources")
        .insert({
          title,
          description: description || null,
          category: category || "general",
          file_name: file.name,
          file_url: filePublicUrl,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user.id,
          visibility,
          folder_id: folderId || null,
        } as never)
        .select("*, uploader:profiles!uploaded_by(id, full_name, avatar_url)")
        .single();
      if (error) throw error;
      return data as Resource;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success("Ressource ajoutee");
    },
    onError: () => toast.error("Erreur lors de l'upload"),
  });
}

export function useUpdateResource() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<
      Pick<
        Resource,
        "title" | "description" | "category" | "visibility" | "is_pinned"
      >
    > & {
      id: string;
    }) => {
      const { data, error } = await supabase
        .from("resources")
        .update(updates as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });
}

export function useDeleteResource() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resource: Pick<Resource, "id" | "file_url">) => {
      // Extract B2 key from URL and delete via API route
      try {
        const url = new URL(resource.file_url);
        // URL format: https://s3.eu-central-003.backblazeb2.com/UPSCALE/resources/...
        const pathParts = url.pathname.split("/").slice(2); // Remove "" and bucket name
        const key = pathParts.join("/");
        if (key) {
          await fetch("/api/storage/delete", {
            method: "DELETE",
            body: JSON.stringify({ key }),
            headers: { "Content-Type": "application/json" },
          });
        }
      } catch {
        // Ignorer les erreurs de suppression de fichier
      }

      const { error } = await supabase
        .from("resources")
        .delete()
        .eq("id", resource.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success("Ressource supprimee");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });
}

export function useTrackDownload() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .rpc("increment_download_count", { resource_id: id } as never)
        .throwOnError();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}

// ─── Folders ─────────────────────────────────

export function useResourceFolders() {
  const supabase = useSupabase();
  const { user, isStaff, isAdmin } = useAuth();

  return useQuery({
    queryKey: [
      "resource-folders",
      isAdmin ? "admin" : isStaff ? "staff" : "client",
    ],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      let query = (supabase as any)
        .from("resource_folders")
        .select("*")
        .order("name", { ascending: true });

      // Admin voit tout, staff voit staff+all, clients voient clients+all
      if (!isStaff) {
        query = query.in("visibility", ["all", "clients"]);
      } else if (!isAdmin) {
        query = query.in("visibility", ["all", "staff"]);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Compter les fichiers par dossier
      const { data: counts } = await (supabase as any)
        .from("resources")
        .select("folder_id")
        .not("folder_id", "is", null);

      const countMap = new Map<string, number>();
      for (const r of counts ?? []) {
        countMap.set(r.folder_id, (countMap.get(r.folder_id) ?? 0) + 1);
      }

      return (data ?? []).map((f: ResourceFolder) => ({
        ...f,
        file_count: countMap.get(f.id) ?? 0,
      })) as ResourceFolder[];
    },
  });
}

export function useCreateFolder() {
  const supabase = useSupabase();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (folder: {
      name: string;
      description?: string;
      icon?: string;
      color?: string;
      visibility: "all" | "staff" | "clients";
      userIds?: string[];
    }) => {
      const { userIds, ...folderData } = folder;
      const { data, error } = await (supabase as any)
        .from("resource_folders")
        .insert({ ...folderData, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;

      // Ajouter les acces individuels
      if (userIds?.length) {
        await (supabase as any).from("resource_folder_access").insert(
          userIds.map((uid: string) => ({
            folder_id: data.id,
            user_id: uid,
          })),
        );
      }

      return data as ResourceFolder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource-folders"] });
      toast.success("Dossier cree");
    },
    onError: () => toast.error("Erreur lors de la creation du dossier"),
  });
}

export function useUpdateFolder() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<
      Pick<
        ResourceFolder,
        "name" | "description" | "icon" | "color" | "visibility"
      >
    > & {
      id: string;
    }) => {
      const { error } = await (supabase as any)
        .from("resource_folders")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource-folders"] });
      toast.success("Dossier mis a jour");
    },
    onError: () => toast.error("Erreur lors de la mise a jour"),
  });
}

export function useDeleteFolder() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Les fichiers du dossier seront mis a folder_id = null (ON DELETE SET NULL)
      const { error } = await (supabase as any)
        .from("resource_folders")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource-folders"] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success("Dossier supprime");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });
}

export function useFolderAccess(folderId: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["folder-access", folderId],
    enabled: !!folderId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("resource_folder_access")
        .select("*, user:profiles(id, full_name, avatar_url, role)")
        .eq("folder_id", folderId);
      if (error) throw error;
      return (data ?? []) as ResourceFolderAccess[];
    },
  });
}

export function useUpdateFolderAccess() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      folderId,
      userIds,
    }: {
      folderId: string;
      userIds: string[];
    }) => {
      // Supprimer les anciens acces
      await (supabase as any)
        .from("resource_folder_access")
        .delete()
        .eq("folder_id", folderId);

      // Ajouter les nouveaux
      if (userIds.length > 0) {
        const { error } = await (supabase as any)
          .from("resource_folder_access")
          .insert(
            userIds.map((uid) => ({
              folder_id: folderId,
              user_id: uid,
            })),
          );
        if (error) throw error;
      }
    },
    onSuccess: (_, { folderId }) => {
      queryClient.invalidateQueries({ queryKey: ["folder-access", folderId] });
      toast.success("Acces mis a jour");
    },
    onError: () => toast.error("Erreur lors de la mise a jour des acces"),
  });
}

export function useMoveResourceToFolder() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      resourceId,
      folderId,
    }: {
      resourceId: string;
      folderId: string | null;
    }) => {
      const { error } = await supabase
        .from("resources")
        .update({ folder_id: folderId } as never)
        .eq("id", resourceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["resource-folders"] });
    },
  });
}
