"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Formation, Module, ModuleProgress, FormationEnrollment } from "@/lib/types/database";

export function useFormations() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchFormations() {
      const { data } = await supabase
        .from("formations")
        .select("*")
        .eq("status", "published")
        .order("order", { ascending: true });
      setFormations(data || []);
      setLoading(false);
    }
    fetchFormations();
  }, []);

  return { formations, loading };
}

export function useFormation(formationId: string) {
  const [formation, setFormation] = useState<Formation | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [enrollment, setEnrollment] = useState<FormationEnrollment | null>(null);
  const [progress, setProgress] = useState<ModuleProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();

      const [formationRes, modulesRes] = await Promise.all([
        supabase.from("formations").select("*").eq("id", formationId).single(),
        supabase.from("modules").select("*").eq("formation_id", formationId).order("order"),
      ]);

      setFormation(formationRes.data);
      setModules(modulesRes.data || []);

      if (user) {
        const [enrollmentRes, progressRes] = await Promise.all([
          supabase.from("formation_enrollments").select("*").eq("user_id", user.id).eq("formation_id", formationId).single(),
          supabase.from("module_progress").select("*").eq("user_id", user.id).eq("formation_id", formationId),
        ]);
        setEnrollment(enrollmentRes.data);
        setProgress(progressRes.data || []);
      }

      setLoading(false);
    }
    fetchData();
  }, [formationId]);

  const enroll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("formation_enrollments")
      .insert({ user_id: user.id, formation_id: formationId })
      .select()
      .single();

    if (data) setEnrollment(data);
  };

  const completionPercent = modules.length > 0
    ? Math.round((progress.filter((p) => p.completed).length / modules.length) * 100)
    : 0;

  return { formation, modules, enrollment, progress, loading, enroll, completionPercent };
}

export function useModule(moduleId: string) {
  const [module, setModule] = useState<Module | null>(null);
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: mod } = await supabase.from("modules").select("*").eq("id", moduleId).single();
      setModule(mod);

      if (user && mod) {
        const { data: prog } = await supabase
          .from("module_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("module_id", moduleId)
          .single();
        setModuleProgress(prog);
      }
      setLoading(false);
    }
    fetchData();
  }, [moduleId]);

  const markCompleted = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !module) return;

    const { data } = await supabase
      .from("module_progress")
      .upsert({
        user_id: user.id,
        module_id: moduleId,
        formation_id: module.formation_id,
        completed: true,
        completed_at: new Date().toISOString(),
      }, { onConflict: "user_id,module_id" })
      .select()
      .single();

    if (data) setModuleProgress(data);
  };

  const updatePosition = async (seconds: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !module) return;

    await supabase
      .from("module_progress")
      .upsert({
        user_id: user.id,
        module_id: moduleId,
        formation_id: module.formation_id,
        last_position_seconds: seconds,
      }, { onConflict: "user_id,module_id" });
  };

  return { module, moduleProgress, loading, markCompleted, updatePosition };
}
