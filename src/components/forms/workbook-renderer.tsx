"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Zap,
  ChevronDown,
  Send,
  AlertTriangle,
  Info,
  MessageSquare,
  Star,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Form, FormField } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WorkbookRendererProps {
  form: Form & { form_fields: FormField[] };
  onSubmit: (answers: Record<string, unknown>) => void;
  isSubmitting: boolean;
}

type Section = { type: "step"; step: FormField; fields: FormField[] };

// ---------------------------------------------------------------------------
// Helper : grouper les champs par etapes
// ---------------------------------------------------------------------------

function groupFieldsBySteps(fields: FormField[]): Section[] {
  const sorted = [...fields].sort((a, b) => a.sort_order - b.sort_order);
  const sections: Section[] = [];

  let currentStep: FormField | null = null;
  let currentStepFields: FormField[] = [];

  for (const field of sorted) {
    if (field.field_type === "step") {
      if (currentStep) {
        sections.push({
          type: "step",
          step: currentStep,
          fields: currentStepFields,
        });
      }
      currentStep = field;
      currentStepFields = [];
    } else {
      if (currentStep) {
        currentStepFields.push(field);
      }
      // Les champs sans step parent sont ignorés — tout doit être dans un step
    }
  }

  if (currentStep) {
    sections.push({
      type: "step",
      step: currentStep,
      fields: currentStepFields,
    });
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Styles constants (dark / light)
// ---------------------------------------------------------------------------

const BRAND_RED = "#c6ff00";
const BRAND_RED_LIGHT = "#c6ff00";

const getCardClass = (dark: boolean) =>
  dark
    ? "bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8"
    : "bg-white border border-zinc-200 shadow-sm rounded-2xl p-6 md:p-8";

const getInputClass = (dark: boolean) =>
  dark
    ? "w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-[#c6ff00]/50 focus:ring-2 focus:ring-[#c6ff00]/20"
    : "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-all focus:border-[#c6ff00]/50 focus:ring-2 focus:ring-[#c6ff00]/20";

const getTextareaClass = (dark: boolean) =>
  dark
    ? "w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-[#c6ff00]/50 focus:ring-2 focus:ring-[#c6ff00]/20 resize-none min-h-[120px]"
    : "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-all focus:border-[#c6ff00]/50 focus:ring-2 focus:ring-[#c6ff00]/20 resize-none min-h-[120px]";

// ---------------------------------------------------------------------------
// Callout block
// ---------------------------------------------------------------------------

function CalloutBlock({ field, dark }: { field: FormField; dark: boolean }) {
  const variant =
    (field.options as unknown as { variant?: string })?.variant ?? "info";

  const variantStyles = {
    warning: {
      border: "border-l-lime-400",
      bg: dark ? "bg-lime-400/10" : "bg-lime-50",
      icon: <AlertTriangle className="h-5 w-5 text-lime-300 shrink-0" />,
    },
    info: {
      border: "border-l-blue-500",
      bg: dark ? "bg-blue-500/10" : "bg-blue-50",
      icon: <Info className="h-5 w-5 text-blue-400 shrink-0" />,
    },
    tip: {
      border: dark ? "border-l-white/30" : "border-l-zinc-300",
      bg: dark ? "bg-white/[0.05]" : "bg-zinc-50",
      icon: (
        <MessageSquare
          className={cn(
            "h-5 w-5 shrink-0",
            dark ? "text-white/50" : "text-zinc-400",
          )}
        />
      ),
    },
  };

  const style =
    variantStyles[variant as keyof typeof variantStyles] ?? variantStyles.info;

  return (
    <div
      className={cn("rounded-xl border-l-4 p-4 md:p-5", style.border, style.bg)}
    >
      <div className="flex gap-3">
        {style.icon}
        <div className="space-y-1 min-w-0">
          {field.label && (
            <p
              className={cn(
                "text-sm font-semibold",
                dark ? "text-white/90" : "text-zinc-900",
              )}
            >
              {field.label}
            </p>
          )}
          {field.description && (
            <p
              className={cn(
                "text-sm leading-relaxed",
                dark ? "text-white/60" : "text-zinc-600",
              )}
            >
              {field.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Checklist block
// ---------------------------------------------------------------------------

function ChecklistBlock({
  field,
  value,
  onChange,
  dark,
}: {
  field: FormField;
  value: string[];
  onChange: (val: string[]) => void;
  dark: boolean;
}) {
  const items = Array.isArray(field.options) ? field.options : [];

  const toggleItem = (itemValue: string) => {
    if (value.includes(itemValue)) {
      onChange(value.filter((v) => v !== itemValue));
    } else {
      onChange([...value, itemValue]);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 md:p-6",
        dark
          ? "border-amber-500/20 bg-amber-500/[0.06]"
          : "border-amber-200 bg-amber-50",
      )}
    >
      {field.label && (
        <p
          className={cn(
            "text-sm font-semibold mb-4",
            dark ? "text-amber-200" : "text-amber-700",
          )}
        >
          {field.label}
        </p>
      )}
      <div className="space-y-3">
        {items.map((item) => {
          const checked = value.includes(item.value);
          return (
            <label
              key={item.value}
              className="flex items-start gap-3 cursor-pointer group"
            >
              <div
                className={cn(
                  "mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                  checked
                    ? "bg-amber-500 border-amber-500"
                    : dark
                      ? "border-white/20 group-hover:border-amber-500/50"
                      : "border-zinc-300 group-hover:border-amber-500/50",
                )}
              >
                {checked && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  </motion.div>
                )}
              </div>
              <span
                className={cn(
                  "text-sm leading-relaxed transition-colors",
                  checked
                    ? dark
                      ? "text-white/90"
                      : "text-zinc-900"
                    : dark
                      ? "text-white/60"
                      : "text-zinc-500",
                )}
              >
                {item.label}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Accordion field (champs classiques)
// ---------------------------------------------------------------------------

function AccordionField({
  field,
  value,
  onChange,
  dark,
}: {
  field: FormField;
  value: unknown;
  onChange: (val: unknown) => void;
  dark: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden",
        dark ? "border-white/10" : "border-zinc-200",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3.5 transition-colors",
          dark ? "hover:bg-white/[0.03]" : "hover:bg-zinc-50",
        )}
      >
        <Zap className="h-4 w-4 text-[#c6ff00] shrink-0" />
        <span
          className={cn(
            "text-sm font-medium flex-1 text-left",
            dark ? "text-white/80" : "text-zinc-700",
          )}
        >
          {field.label}
          {field.is_required && <span className="text-[#c6ff00] ml-1">*</span>}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            dark ? "text-white/40" : "text-zinc-400",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">
              {field.description && (
                <p
                  className={cn(
                    "text-xs mb-3",
                    dark ? "text-white/40" : "text-zinc-400",
                  )}
                >
                  {field.description}
                </p>
              )}
              <WorkbookFieldInput
                field={field}
                value={value}
                onChange={onChange}
                dark={dark}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rendu des inputs par type
// ---------------------------------------------------------------------------

function WorkbookFieldInput({
  field,
  value,
  onChange,
  dark,
}: {
  field: FormField;
  value: unknown;
  onChange: (val: unknown) => void;
  dark: boolean;
}) {
  switch (field.field_type) {
    case "short_text":
    case "email":
    case "phone":
    case "number":
      return (
        <input
          type={
            field.field_type === "email"
              ? "email"
              : field.field_type === "phone"
                ? "tel"
                : field.field_type === "number"
                  ? "number"
                  : "text"
          }
          className={getInputClass(dark)}
          placeholder={field.placeholder ?? ""}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "long_text":
      return (
        <textarea
          className={getTextareaClass(dark)}
          placeholder={field.placeholder ?? ""}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      );

    case "single_select":
    case "dropdown": {
      const options = Array.isArray(field.options) ? field.options : [];
      return (
        <select
          className={cn(getInputClass(dark), "appearance-none cursor-pointer")}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" className={dark ? "bg-zinc-900" : ""}>
            {field.placeholder ?? "Sélectionner..."}
          </option>
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className={dark ? "bg-zinc-900" : ""}
            >
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    case "rating": {
      const maxStars = 5;
      const currentRating = (value as number) ?? 0;
      return (
        <div className="flex gap-2">
          {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  "h-7 w-7 transition-colors",
                  star <= currentRating
                    ? "fill-amber-400 text-amber-400"
                    : dark
                      ? "text-white/20 hover:text-amber-400/50"
                      : "text-zinc-300 hover:text-amber-400/50",
                )}
              />
            </button>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Section : Intro
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Section : Step
// ---------------------------------------------------------------------------

function StepSection({
  step,
  stepNumber,
  fields,
  answers,
  onFieldChange,
  delay,
  dark,
}: {
  step: FormField;
  stepNumber: number;
  fields: FormField[];
  answers: Record<string, unknown>;
  onFieldChange: (fieldId: string, value: unknown) => void;
  delay: number;
  dark: boolean;
}) {
  const content =
    (step.options as unknown as { content?: string })?.content ?? null;

  // Filtrer les types statiques
  const renderableFields = fields.filter(
    (f) => !["heading", "paragraph", "divider"].includes(f.field_type),
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={getCardClass(dark)}
    >
      {/* En-tete de l'etape */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm"
          style={{
            background: `linear-gradient(135deg, ${BRAND_RED}, ${BRAND_RED_LIGHT})`,
          }}
        >
          {stepNumber}
        </div>
        <div className="min-w-0">
          <h2
            className={cn(
              "text-lg font-bold",
              dark ? "text-white" : "text-zinc-900",
            )}
          >
            {step.label}
          </h2>
          {step.description && (
            <p
              className={cn(
                "text-sm mt-1",
                dark ? "text-white/50" : "text-zinc-500",
              )}
            >
              {step.description}
            </p>
          )}
        </div>
      </div>

      {/* Contenu de l'etape */}
      {content && (
        <div className="mb-6 pl-14">
          <p
            className={cn(
              "text-sm leading-relaxed whitespace-pre-wrap",
              dark ? "text-white/60" : "text-zinc-600",
            )}
          >
            {content}
          </p>
        </div>
      )}

      {/* Champs de l'etape */}
      {renderableFields.length > 0 && (
        <div className="space-y-4 pl-0 md:pl-14">
          {renderableFields.map((field) => {
            if (field.field_type === "callout") {
              return <CalloutBlock key={field.id} field={field} dark={dark} />;
            }
            if (field.field_type === "checklist") {
              return (
                <ChecklistBlock
                  key={field.id}
                  field={field}
                  value={(answers[field.id] as string[]) ?? []}
                  onChange={(val) => onFieldChange(field.id, val)}
                  dark={dark}
                />
              );
            }
            return (
              <AccordionField
                key={field.id}
                field={field}
                value={answers[field.id]}
                onChange={(val) => onFieldChange(field.id, val)}
                dark={dark}
              />
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Composant principal : WorkbookRenderer
// ---------------------------------------------------------------------------

export function WorkbookRenderer({
  form,
  onSubmit,
  isSubmitting,
}: WorkbookRendererProps) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [dark, setDark] = useState(false);

  const sections = groupFieldsBySteps(form.form_fields ?? []);

  const handleFieldChange = useCallback((fieldId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(answers);
  };

  // Compteur d'etapes pour numerotation
  let stepCounter = 0;

  return (
    <div
      className={cn(
        "min-h-screen",
        dark
          ? "bg-gradient-to-br from-slate-950 via-lime-950 to-slate-900 text-white"
          : "bg-gradient-to-br from-white via-rose-50/30 to-slate-50 text-zinc-900",
      )}
    >
      {/* Toggle dark/light */}
      <button
        type="button"
        onClick={() => setDark(!dark)}
        className={cn(
          "fixed top-4 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all",
          dark
            ? "bg-white/10 hover:bg-white/20 text-white"
            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700",
        )}
      >
        {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="max-w-[720px] mx-auto px-4 py-12 md:py-20">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* --- Cover --- */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-5 pb-4"
          >
            {/* Badge */}
            <div
              className={cn(
                "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-medium",
                dark
                  ? "border-white/10 bg-white/[0.05] text-white/70"
                  : "border-zinc-200 bg-zinc-50 text-zinc-600",
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-[#c6ff00]" />
              Workbook Premium
            </div>

            {/* Titre */}
            <h1
              className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight"
              style={{
                background: `linear-gradient(135deg, ${BRAND_RED}, ${BRAND_RED_LIGHT})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {form.title}
            </h1>

            {/* Description */}
            {form.description && (
              <p
                className={cn(
                  "text-base md:text-lg max-w-lg mx-auto leading-relaxed",
                  dark ? "text-white/50" : "text-zinc-500",
                )}
              >
                {form.description}
              </p>
            )}
          </motion.div>

          {/* --- Sections --- */}
          {sections.map((section, idx) => {
            stepCounter++;
            return (
              <StepSection
                key={section.step.id}
                step={section.step}
                stepNumber={stepCounter}
                fields={section.fields}
                answers={answers}
                onFieldChange={handleFieldChange}
                delay={0.1 + idx * 0.08}
                dark={dark}
              />
            );
          })}

          {/* --- Bouton submit --- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + sections.length * 0.08 }}
          >
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl text-base font-semibold text-white transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                dark
                  ? "hover:shadow-lg hover:shadow-lime-400/20 active:scale-[0.98]"
                  : "hover:shadow-lg hover:shadow-lime-400/15 active:scale-[0.98]",
              )}
              style={{
                background: `linear-gradient(135deg, ${BRAND_RED}, ${BRAND_RED_LIGHT})`,
              }}
            >
              {isSubmitting ? (
                <>
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Envoyer le workbook
                </>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
