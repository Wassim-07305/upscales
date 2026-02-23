"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile, Tag, CrmNote } from "@/lib/types/database";

export interface StudentWithDetails extends Profile {
  tags: Tag[];
  enrollments_count: number;
  notes_count: number;
}

export function useCRM(filters?: { role?: string; search?: string; tagId?: string }) {
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });

      if (filters?.role) {
        query = query.eq("role", filters.role);
      }
      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data: profiles } = await query;

      if (!profiles) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const userIds = profiles.map((p) => p.id);

      const [tagsRes, enrollmentsRes, notesRes] = await Promise.all([
        supabase.from("user_tags").select("*, tag:tags(*)").in("user_id", userIds),
        supabase.from("formation_enrollments").select("user_id").in("user_id", userIds),
        supabase.from("crm_notes").select("student_id").in("student_id", userIds),
      ]);

      const userTags = tagsRes.data || [];
      const enrollments = enrollmentsRes.data || [];
      const notes = notesRes.data || [];

      const studentsWithDetails: StudentWithDetails[] = profiles.map((p) => ({
        ...p,
        tags: userTags
          .filter((ut) => ut.user_id === p.id && ut.tag)
          .map((ut) => ut.tag as Tag),
        enrollments_count: enrollments.filter((e) => e.user_id === p.id).length,
        notes_count: notes.filter((n) => n.student_id === p.id).length,
      }));

      if (filters?.tagId) {
        setStudents(studentsWithDetails.filter((s) => s.tags.some((t) => t.id === filters.tagId)));
      } else {
        setStudents(studentsWithDetails);
      }

      setLoading(false);
    }
    fetchStudents();
  }, [filters?.role, filters?.search, filters?.tagId]);

  return { students, loading };
}

export function useStudentDetail(userId: string) {
  const [student, setStudent] = useState<Profile | null>(null);
  const [notes, setNotes] = useState<CrmNote[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const [profileRes, notesRes, userTagsRes, allTagsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("crm_notes").select("*, author:profiles(*)").eq("student_id", userId).order("created_at", { ascending: false }),
        supabase.from("user_tags").select("*, tag:tags(*)").eq("user_id", userId),
        supabase.from("tags").select("*").order("name"),
      ]);

      setStudent(profileRes.data);
      setNotes(notesRes.data || []);
      setTags(userTagsRes.data?.map((ut) => ut.tag as Tag).filter(Boolean) || []);
      setAllTags(allTagsRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, [userId]);

  const addNote = async (content: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("crm_notes")
      .insert({ student_id: userId, author_id: user.id, content })
      .select("*, author:profiles(*)")
      .single();

    if (data) setNotes((prev) => [data, ...prev]);
  };

  const addTag = async (tagId: string) => {
    await supabase.from("user_tags").insert({ user_id: userId, tag_id: tagId });
    const tag = allTags.find((t) => t.id === tagId);
    if (tag) setTags((prev) => [...prev, tag]);
  };

  const removeTag = async (tagId: string) => {
    await supabase.from("user_tags").delete().eq("user_id", userId).eq("tag_id", tagId);
    setTags((prev) => prev.filter((t) => t.id !== tagId));
  };

  const updateRole = async (role: string) => {
    await supabase.from("profiles").update({ role }).eq("id", userId);
    if (student) setStudent({ ...student, role: role as Profile["role"] });
  };

  return { student, notes, tags, allTags, loading, addNote, addTag, removeTag, updateRole };
}
