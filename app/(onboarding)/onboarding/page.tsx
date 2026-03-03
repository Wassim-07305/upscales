"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import confetti from "canvas-confetti";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Upload,
  Send,
  User,
  Phone,
  FileText,
} from "lucide-react";

// ─── Role labels ─────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  moderator: "Moderateur",
  member: "Membre",
  prospect: "Nouveau membre",
};

// ─── Step definitions ────────────────────────────────────────────
type StepType = "welcome" | "avatar" | "text" | "textarea" | "summary";

interface Step {
  id: string;
  type: StepType;
  title: string;
  subtitle?: string;
  placeholder?: string;
}

const STEPS: Step[] = [
  {
    id: "welcome",
    type: "welcome",
    title: "Bienvenue sur Upscale",
    subtitle: "On va prendre 1 minute pour completer ton profil.",
  },
  {
    id: "avatar",
    type: "avatar",
    title: "Ta photo de profil",
    subtitle:
      "Ajoute une photo pour que les autres membres te reconnaissent.",
  },
  {
    id: "phone",
    type: "text",
    title: "Ton numero de telephone",
    subtitle: "Pour que l'equipe puisse te contacter rapidement.",
    placeholder: "06 12 34 56 78",
  },
  {
    id: "bio",
    type: "textarea",
    title: "Presente-toi en quelques mots",
    subtitle: "Ton experience, ton parcours, ce qui t'amene ici.",
    placeholder:
      "Ex: Entrepreneur depuis 2 ans, je cherche a structurer mon business...",
  },
  {
    id: "summary",
    type: "summary",
    title: "Ton profil est pret !",
    subtitle: "Verifie que tout est correct avant de continuer.",
  },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// ─── Animated background ────────────────────────────────────────
function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#C6FF00]/8 blur-3xl animate-pulse" />
      <div
        className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-[#7FFFD4]/8 blur-3xl"
        style={{ animation: "pulse 4s ease-in-out infinite 1s" }}
      />
      <div
        className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[#C6FF00]/5 blur-3xl"
        style={{ animation: "pulse 5s ease-in-out infinite 2s" }}
      />
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // User data
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("prospect");
  const [firstName, setFirstName] = useState("");

  // Form state
  const [avatarUrl, setAvatarUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  const currentStep = STEPS[step];
  const totalSteps = STEPS.length;
  const progress = ((step + 1) / totalSteps) * 100;
  const isFirst = step === 0;
  const isLast = step === totalSteps - 1;

  // ─── Load user & profile ────────────────────────────────────
  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profile) {
        router.push("/login");
        return;
      }

      // Already completed → go to dashboard
      if (profile.onboarding_completed) {
        router.push("/dashboard");
        return;
      }

      setUserId(user.id);
      setRole(profile.role ?? "prospect");
      setFirstName(profile.full_name?.split(" ")[0] ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
      setPhone(profile.phone ?? "");
      setBio(profile.bio ?? "");

      // Resume at appropriate step
      if (profile.bio) setStep(4);
      else if (profile.phone) setStep(3);
      else if (profile.avatar_url) setStep(2);

      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Save current step data ─────────────────────────────────
  const saveCurrentStep = useCallback(async () => {
    const stepId = STEPS[step]?.id;
    if (stepId === "phone" && phone) {
      await supabase.from("profiles").update({ phone }).eq("id", userId);
    } else if (stepId === "bio" && bio) {
      await supabase.from("profiles").update({ bio }).eq("id", userId);
    }
  }, [step, phone, bio, userId, supabase]);

  // ─── Navigation ─────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (step < totalSteps - 1) {
      if (step > 0) saveCurrentStep();
      setDirection(1);
      setStep((s) => s + 1);
    }
  }, [step, totalSteps, saveCurrentStep]);

  const goPrev = useCallback(() => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }, [step]);

  // ─── Complete onboarding ────────────────────────────────────
  const handleComplete = useCallback(async () => {
    if (!userId) return;
    setSaving(true);
    try {
      await saveCurrentStep();
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", userId);

      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#C6FF00", "#7FFFD4", "#ffffff", "#a3e635"],
      });

      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } catch {
      toast.error("Erreur lors de la finalisation");
      setSaving(false);
    }
  }, [userId, saveCurrentStep, supabase, router]);

  // ─── Avatar upload ──────────────────────────────────────────
  const handleAvatarUpload = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error("Fichier trop volumineux (max 5 Mo)");
        return;
      }
      if (!userId) return;
      setUploading(true);
      try {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${userId}/avatar_${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, file, { upsert: true });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(path);

        await supabase
          .from("profiles")
          .update({ avatar_url: publicUrl })
          .eq("id", userId);

        setAvatarUrl(publicUrl);
        toast.success("Photo ajoutee !");
      } catch {
        toast.error("Erreur lors de l'upload");
      } finally {
        setUploading(false);
      }
    },
    [userId, supabase]
  );

  // ─── Auto-focus inputs ──────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, [step]);

  // ─── Keyboard navigation ───────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "TEXTAREA") return;
        e.preventDefault();
        if (isLast) {
          handleComplete();
        } else {
          goNext();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isLast, goNext, handleComplete]);

  // ─── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C6FF00] border-t-transparent" />
      </div>
    );
  }

  // ─── Render step content ────────────────────────────────────
  function renderStep(s: Step) {
    switch (s.type) {
      case "welcome":
        return (
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="mb-8"
            >
              <Image
                src="/icons/icon-48x48.png"
                alt="Upscale"
                width={96}
                height={96}
                className="rounded-3xl"
                style={{
                  filter: "drop-shadow(0 0 30px rgba(198, 255, 0, 0.4))",
                }}
                priority
              />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-3 text-4xl font-bold tracking-tight text-white sm:text-5xl"
            >
              {firstName ? `Salut ${firstName} !` : s.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-3 max-w-md text-lg text-white/50"
            >
              {s.subtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mb-10 rounded-xl bg-white/5 px-4 py-2 text-sm text-white/40"
            >
              Ton role :{" "}
              <span className="font-medium text-[#C6FF00]">
                {ROLE_LABELS[role] ?? role}
              </span>
            </motion.div>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              onClick={goNext}
              className="group flex items-center gap-3 rounded-2xl bg-[#C6FF00] px-8 py-4 text-lg font-semibold text-[#0D0D0D] shadow-xl shadow-[#C6FF00]/25 transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:shadow-[#C6FF00]/40"
            >
              C&apos;est parti
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </motion.button>
          </div>
        );

      case "avatar":
        return (
          <div className="flex flex-col items-center">
            {avatarUrl ? (
              <div className="group relative mb-6">
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-32 w-32 rounded-3xl border-4 border-[#C6FF00]/30 object-cover shadow-xl shadow-[#C6FF00]/10"
                />
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-3xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAvatarUpload(file);
                      e.target.value = "";
                    }}
                  />
                  <span className="text-sm font-medium text-white">
                    Changer
                  </span>
                </label>
              </div>
            ) : (
              <label className="group mb-6 flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/20 bg-white/5 transition-all duration-200 hover:border-[#C6FF00]/50 hover:bg-white/10">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                    e.target.value = "";
                  }}
                />
                {uploading ? (
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C6FF00] border-t-transparent" />
                ) : (
                  <>
                    <Upload className="mb-2 h-8 w-8 text-white/40 group-hover:text-[#C6FF00]" />
                    <span className="text-xs font-medium text-white/40 group-hover:text-white/60">
                      Upload
                    </span>
                  </>
                )}
              </label>
            )}
            <p className="text-sm text-white/30">JPG, PNG — max 5 Mo</p>
          </div>
        );

      case "text":
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="tel"
            placeholder={s.placeholder}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border-b-2 border-white/20 bg-transparent pb-3 text-2xl font-medium text-white placeholder-white/25 outline-none transition-colors focus:border-[#C6FF00] sm:text-3xl"
          />
        );

      case "textarea":
        return (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            placeholder={s.placeholder}
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full resize-none rounded-xl border-2 border-white/20 bg-white/5 px-5 py-4 text-lg text-white placeholder-white/25 outline-none transition-colors focus:border-[#C6FF00]"
          />
        );

      case "summary":
        return (
          <div className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-14 w-14 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                  <User className="h-6 w-6 text-white/40" />
                </div>
              )}
              <div>
                <p className="text-sm text-white/40">Photo de profil</p>
                <p className="font-medium text-white">
                  {avatarUrl ? "Ajoutee" : "Non renseignee"}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <Phone className="h-6 w-6 text-white/40" />
              </div>
              <div>
                <p className="text-sm text-white/40">Telephone</p>
                <p className="font-medium text-white">
                  {phone || "Non renseigne"}
                </p>
              </div>
            </div>

            {/* Bio */}
            <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <FileText className="h-6 w-6 text-white/40" />
              </div>
              <div>
                <p className="text-sm text-white/40">Bio</p>
                <p className="font-medium text-white">
                  {bio || "Non renseignee"}
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[#0D0D0D]">
      <AnimatedBackground />

      {/* Progress bar */}
      <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-white/10">
        <motion.div
          className="h-full bg-gradient-to-r from-[#C6FF00] to-[#7FFFD4]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-5">
        <button
          onClick={goPrev}
          disabled={isFirst}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
            isFirst
              ? "cursor-not-allowed opacity-0"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          }`}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <Image
            src="/icons/icon-48x48.png"
            alt="Upscale"
            width={24}
            height={24}
            className="rounded-md"
          />
          <span className="font-display text-sm font-bold text-white/60">
            UPSCALE
          </span>
        </div>

        <span className="text-sm tabular-nums text-white/30">
          {step + 1}/{totalSteps}
        </span>
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ y: direction > 0 ? 40 : -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: direction > 0 ? -40 : 40, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Step title */}
            {currentStep.type !== "welcome" && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {currentStep.title}
                </h2>
                {currentStep.subtitle && (
                  <p className="mt-2 text-base text-white/40">
                    {currentStep.subtitle}
                  </p>
                )}
              </div>
            )}

            {/* Step content */}
            {renderStep(currentStep)}

            {/* Navigation */}
            {currentStep.type !== "welcome" && (
              <div className="mt-8 flex items-center gap-4">
                {isLast ? (
                  <button
                    onClick={handleComplete}
                    disabled={saving}
                    className="flex items-center gap-3 rounded-xl bg-[#C6FF00] px-7 py-3.5 text-base font-semibold text-[#0D0D0D] shadow-lg shadow-[#C6FF00]/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-[#C6FF00]/40 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0D0D0D] border-t-transparent" />
                    ) : (
                      <>
                        C&apos;est parti !
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={goNext}
                    className="flex items-center gap-2 rounded-xl bg-[#C6FF00] px-6 py-3 text-base font-semibold text-[#0D0D0D] transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#C6FF00]/25"
                  >
                    OK
                    <CheckCircle className="h-4 w-4" />
                  </button>
                )}
                <span className="text-sm text-white/25">
                  Appuie sur{" "}
                  <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">
                    Entree
                  </kbd>
                </span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
