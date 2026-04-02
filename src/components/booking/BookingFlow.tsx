"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  useAvailableSlots,
  useCreateBooking,
  type QualificationField,
} from "@/hooks/use-booking-pages";
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  Loader2,
  User,
  Mail,
  Phone,
  ArrowRight,
} from "lucide-react";
import {
  format,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  addMonths,
  subMonths,
  getDay,
  startOfDay,
  addHours,
} from "date-fns";
import { fr } from "date-fns/locale";

type Step = "qualification" | "date" | "slot" | "confirm" | "done";

interface BookingFlowPage {
  id: string;
  title: string;
  description: string | null;
  brand_color: string;
  slot_duration: number;
  min_notice_hours: number;
  max_days_ahead: number;
  qualification_fields: QualificationField[];
}

interface BookingFlowProps {
  page: BookingFlowPage;
  /** Quand true, supprime le fond plein écran, le header et le footer (pour embed dans l'app) */
  embedded?: boolean;
  /** Pré-rempli depuis le profil connecté */
  prefill?: { name?: string; email?: string; phone?: string };
}

export function BookingFlow({ page, embedded, prefill }: BookingFlowProps) {
  const [step, setStep] = useState<Step>("qualification");
  const [formData, setFormData] = useState({
    name: prefill?.name ?? "",
    email: prefill?.email ?? "",
    phone: prefill?.phone ?? "",
    custom: {} as Record<string, string>,
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    start_time: string;
    end_time: string;
  } | null>(null);

  const createBooking = useCreateBooking();

  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;
  const { data: slots, isLoading: slotsLoading } = useAvailableSlots(
    page.id,
    dateStr,
  );

  const brandColor = page.brand_color || "#c6ff00";

  const handleConfirm = () => {
    if (!selectedDate || !selectedSlot) return;
    createBooking.mutate(
      {
        booking_page_id: page.id,
        prospect_name: formData.name,
        prospect_email: formData.email || undefined,
        prospect_phone: formData.phone || undefined,
        date: format(selectedDate, "yyyy-MM-dd"),
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        qualification_answers: formData.custom,
      },
      { onSuccess: () => setStep("done") },
    );
  };

  const requiredCustomFieldsFilled = (page?.qualification_fields ?? [])
    .filter((f: QualificationField) => f.required)
    .every(
      (f: QualificationField) =>
        (formData.custom?.[f.id] ?? "").toString().trim().length > 0,
    );
  const canProceedFromQualification =
    formData.name.trim().length > 0 && requiredCustomFieldsFilled;

  const steps: { key: Step; label: string }[] = [
    { key: "qualification", label: "Infos" },
    { key: "date", label: "Date" },
    { key: "slot", label: "Heure" },
    { key: "confirm", label: "Confirmation" },
  ];

  const content = (
    <>
      {/* Progress */}
      {step !== "done" && (
        <div
          className={cn(
            "w-full",
            embedded ? "mb-6" : "max-w-2xl mx-auto w-full px-6 pt-6",
          )}
        >
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center flex-1">
                <div
                  className={cn(
                    "h-1.5 rounded-full w-full transition-all duration-300",
                    step === s.key || steps.findIndex((x) => x.key === step) > i
                      ? "opacity-100"
                      : "bg-zinc-800 opacity-50",
                  )}
                  style={{
                    backgroundColor:
                      step === s.key ||
                      steps.findIndex((x) => x.key === step) > i
                        ? brandColor
                        : undefined,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((s) => (
              <span
                key={s.key}
                className={cn(
                  "text-[10px] font-medium",
                  step === s.key
                    ? embedded
                      ? "text-foreground"
                      : "text-white"
                    : "text-zinc-600",
                )}
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Steps */}
      <div
        className={cn(
          embedded
            ? "w-full"
            : "flex-1 flex items-start justify-center px-6 py-8",
        )}
      >
        <div className={cn(embedded ? "w-full" : "w-full max-w-2xl")}>
          <AnimatePresence mode="wait">
            {step === "qualification" && (
              <StepQualification
                key="qualification"
                formData={formData}
                setFormData={setFormData}
                customFields={page.qualification_fields ?? []}
                brandColor={brandColor}
                onNext={() => setStep("date")}
                canProceed={canProceedFromQualification}
                embedded={embedded}
              />
            )}
            {step === "date" && (
              <StepDate
                key="date"
                selectedDate={selectedDate}
                onSelectDate={(d) => {
                  setSelectedDate(d);
                  setSelectedSlot(null);
                  setStep("slot");
                }}
                onBack={() => setStep("qualification")}
                brandColor={brandColor}
                minNoticeHours={page.min_notice_hours}
                maxDaysAhead={page.max_days_ahead}
                embedded={embedded}
              />
            )}
            {step === "slot" && (
              <StepSlot
                key="slot"
                slots={slots ?? []}
                isLoading={slotsLoading}
                selectedSlot={selectedSlot}
                onSelectSlot={(s) => {
                  setSelectedSlot(s);
                  setStep("confirm");
                }}
                onBack={() => setStep("date")}
                brandColor={brandColor}
                selectedDate={selectedDate!}
                slotDuration={page.slot_duration}
                embedded={embedded}
              />
            )}
            {step === "confirm" && (
              <StepConfirm
                key="confirm"
                formData={formData}
                selectedDate={selectedDate!}
                selectedSlot={selectedSlot!}
                slotDuration={page.slot_duration}
                brandColor={brandColor}
                onBack={() => setStep("slot")}
                onConfirm={handleConfirm}
                isPending={createBooking.isPending}
                embedded={embedded}
              />
            )}
            {step === "done" && (
              <StepDone
                key="done"
                brandColor={brandColor}
                name={formData.name}
                selectedDate={selectedDate!}
                selectedSlot={selectedSlot!}
                embedded={embedded}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );

  if (embedded) {
    return <div className="w-full space-y-0">{content}</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: brandColor + "20" }}
          >
            <CalendarCheck className="w-5 h-5" style={{ color: brandColor }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{page.title}</h1>
            {page.description && (
              <p className="text-sm text-zinc-400 mt-0.5">{page.description}</p>
            )}
          </div>
        </div>
      </header>
      <div className="flex flex-col flex-1">{content}</div>
      <footer className="border-t border-white/[0.04] py-4 text-center">
        <p className="text-xs text-zinc-600">
          Propulsé par{" "}
          <span className="text-zinc-400 font-medium">UPSCALE</span>
        </p>
      </footer>
    </div>
  );
}

// ─── Step: Qualification ────────────────────────────────────

function inputClass(embedded?: boolean) {
  return embedded
    ? "w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:border-primary"
    : "w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:border-transparent";
}

function labelClass(embedded?: boolean) {
  return embedded
    ? "text-sm font-medium text-foreground mb-1.5 block"
    : "text-sm font-medium text-zinc-300 mb-1.5 block";
}

function StepQualification({
  formData,
  setFormData,
  customFields,
  brandColor,
  onNext,
  canProceed,
  embedded,
}: {
  formData: {
    name: string;
    email: string;
    phone: string;
    custom: Record<string, string>;
  };
  setFormData: React.Dispatch<React.SetStateAction<typeof formData>>;
  customFields: QualificationField[];
  brandColor: string;
  onNext: () => void;
  canProceed: boolean;
  embedded?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div>
        <h2
          className={cn(
            "text-xl font-bold mb-1",
            embedded ? "text-foreground" : "text-white",
          )}
        >
          Vos coordonnées
        </h2>
        <p
          className={cn(
            "text-sm",
            embedded ? "text-muted-foreground" : "text-zinc-400",
          )}
        >
          Remplissez vos informations pour prendre rendez-vous
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className={labelClass(embedded)}>Nom complet *</label>
          <div className="relative">
            <User
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
                embedded ? "text-muted-foreground" : "text-zinc-500",
              )}
            />
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((p) => ({ ...p, name: e.target.value }))
              }
              className={cn(inputClass(embedded), "pl-10")}
              placeholder="Jean Dupont"
            />
          </div>
        </div>
        <div>
          <label className={labelClass(embedded)}>Email</label>
          <div className="relative">
            <Mail
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
                embedded ? "text-muted-foreground" : "text-zinc-500",
              )}
            />
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((p) => ({ ...p, email: e.target.value }))
              }
              className={cn(inputClass(embedded), "pl-10")}
              placeholder="jean@exemple.com"
            />
          </div>
        </div>
        <div>
          <label className={labelClass(embedded)}>Téléphone</label>
          <div className="relative">
            <Phone
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
                embedded ? "text-muted-foreground" : "text-zinc-500",
              )}
            />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData((p) => ({ ...p, phone: e.target.value }))
              }
              className={cn(inputClass(embedded), "pl-10")}
              placeholder="06 12 34 56 78"
            />
          </div>
        </div>
        {customFields.map((field) => (
          <div key={field.id}>
            <label className={labelClass(embedded)}>
              {field.label}
              {field.required && " *"}
            </label>
            {field.type === "textarea" ? (
              <textarea
                value={formData.custom[field.id] ?? ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    custom: { ...p.custom, [field.id]: e.target.value },
                  }))
                }
                rows={3}
                className={cn(inputClass(embedded), "resize-none")}
              />
            ) : field.type === "select" ? (
              <select
                value={formData.custom[field.id] ?? ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    custom: { ...p.custom, [field.id]: e.target.value },
                  }))
                }
                className={inputClass(embedded)}
              >
                <option value="">Sélectionnez...</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={
                  field.type === "email"
                    ? "email"
                    : field.type === "phone"
                      ? "tel"
                      : "text"
                }
                value={formData.custom[field.id] ?? ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    custom: { ...p.custom, [field.id]: e.target.value },
                  }))
                }
                className={inputClass(embedded)}
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
        style={{ backgroundColor: brandColor }}
      >
        Choisir une date <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ─── Step: Date ─────────────────────────────────────────────

function StepDate({
  selectedDate,
  onSelectDate,
  onBack,
  brandColor,
  minNoticeHours,
  maxDaysAhead,
  embedded,
}: {
  selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
  onBack: () => void;
  brandColor: string;
  minNoticeHours: number;
  maxDaysAhead: number;
  embedded?: boolean;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const minDate = useMemo(
    () => startOfDay(addHours(new Date(), minNoticeHours)),
    [minNoticeHours],
  );
  const maxDate = useMemo(
    () => addDays(new Date(), maxDaysAhead),
    [maxDaysAhead],
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const paddingDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const calBg = embedded
    ? "bg-surface border border-border"
    : "bg-zinc-900 border border-zinc-800";
  const navBtnClass = embedded
    ? "p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    : "p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <button onClick={onBack} className={cn(navBtnClass, "p-2")}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2
            className={cn(
              "text-xl font-bold",
              embedded ? "text-foreground" : "text-white",
            )}
          >
            Choisissez une date
          </h2>
          <p
            className={cn(
              "text-sm",
              embedded ? "text-muted-foreground" : "text-zinc-400",
            )}
          >
            Sélectionnez un jour dans le calendrier
          </p>
        </div>
      </div>

      <div className={cn("rounded-2xl p-5", calBg)}>
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className={navBtnClass}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span
            className={cn(
              "text-sm font-semibold capitalize",
              embedded ? "text-foreground" : "text-white",
            )}
          >
            {format(currentMonth, "MMMM yyyy", { locale: fr })}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className={navBtnClass}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
            <div
              key={d}
              className={cn(
                "text-center text-[11px] font-medium py-1",
                embedded ? "text-muted-foreground" : "text-zinc-500",
              )}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: paddingDays }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((day) => {
            const disabled =
              isBefore(day, minDate) ||
              isBefore(maxDate, day) ||
              !isSameMonth(day, currentMonth);
            const selected =
              selectedDate !== null && isSameDay(day, selectedDate);
            const today = isToday(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => !disabled && onSelectDate(day)}
                disabled={disabled}
                className={cn(
                  "aspect-square rounded-xl text-sm font-medium transition-all duration-150 flex items-center justify-center",
                  disabled
                    ? "text-zinc-700 cursor-not-allowed"
                    : embedded
                      ? "text-foreground hover:bg-muted cursor-pointer"
                      : "text-zinc-200 hover:bg-zinc-800 cursor-pointer",
                  selected && "text-white ring-2",
                  today &&
                    !selected &&
                    (embedded
                      ? "text-primary font-bold"
                      : "text-white font-bold"),
                )}
                style={
                  selected
                    ? {
                        backgroundColor: brandColor,
                        ["--tw-ring-color" as string]: brandColor,
                      }
                    : undefined
                }
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Step: Slot ─────────────────────────────────────────────

function StepSlot({
  slots,
  isLoading,
  selectedSlot,
  onSelectSlot,
  onBack,
  brandColor,
  selectedDate,
  slotDuration,
  embedded,
}: {
  slots: { start_time: string; end_time: string }[];
  isLoading: boolean;
  selectedSlot: { start_time: string; end_time: string } | null;
  onSelectSlot: (s: { start_time: string; end_time: string }) => void;
  onBack: () => void;
  brandColor: string;
  selectedDate: Date;
  slotDuration: number;
  embedded?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className={
            embedded
              ? "p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              : "p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          }
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2
            className={cn(
              "text-xl font-bold",
              embedded ? "text-foreground" : "text-white",
            )}
          >
            Choisissez un créneau
          </h2>
          <p
            className={cn(
              "text-sm",
              embedded ? "text-muted-foreground" : "text-zinc-400",
            )}
          >
            {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })} ·{" "}
            {slotDuration} min
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p
            className={cn(
              "text-sm",
              embedded ? "text-muted-foreground" : "text-zinc-400",
            )}
          >
            Aucun créneau disponible pour cette date
          </p>
          <button
            onClick={onBack}
            className="mt-3 text-sm font-medium hover:underline"
            style={{ color: brandColor }}
          >
            Choisir une autre date
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slots.map((slot) => {
            const isSelected = selectedSlot?.start_time === slot.start_time;
            return (
              <button
                key={slot.start_time}
                onClick={() => onSelectSlot(slot)}
                className={cn(
                  "py-3 px-3 rounded-xl text-sm font-medium transition-all duration-150 border",
                  isSelected
                    ? "text-white border-transparent"
                    : embedded
                      ? "text-foreground border-border bg-surface hover:border-primary/50"
                      : "text-zinc-200 border-zinc-800 bg-zinc-900 hover:border-zinc-600",
                )}
                style={
                  isSelected
                    ? { backgroundColor: brandColor, borderColor: brandColor }
                    : undefined
                }
              >
                {slot.start_time}
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ─── Step: Confirm ──────────────────────────────────────────

function StepConfirm({
  formData,
  selectedDate,
  selectedSlot,
  slotDuration,
  brandColor,
  onBack,
  onConfirm,
  isPending,
  embedded,
}: {
  formData: { name: string; email: string; phone: string };
  selectedDate: Date;
  selectedSlot: { start_time: string; end_time: string };
  slotDuration: number;
  brandColor: string;
  onBack: () => void;
  onConfirm: () => void;
  isPending: boolean;
  embedded?: boolean;
}) {
  const cardClass = embedded
    ? "bg-surface border border-border rounded-2xl p-6 space-y-4"
    : "bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4";
  const dividerClass = embedded ? "h-px bg-border" : "h-px bg-zinc-800";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className={
            embedded
              ? "p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              : "p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          }
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2
            className={cn(
              "text-xl font-bold",
              embedded ? "text-foreground" : "text-white",
            )}
          >
            Confirmation
          </h2>
          <p
            className={cn(
              "text-sm",
              embedded ? "text-muted-foreground" : "text-zinc-400",
            )}
          >
            Vérifiez les informations avant de confirmer
          </p>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: brandColor + "20" }}
          >
            <User className="w-5 h-5" style={{ color: brandColor }} />
          </div>
          <div>
            <p
              className={cn(
                "text-sm font-semibold",
                embedded ? "text-foreground" : "text-white",
              )}
            >
              {formData.name}
            </p>
            <div
              className={cn(
                "flex items-center gap-3 text-xs",
                embedded ? "text-muted-foreground" : "text-zinc-400",
              )}
            >
              {formData.email && <span>{formData.email}</span>}
              {formData.phone && <span>{formData.phone}</span>}
            </div>
          </div>
        </div>
        <div className={dividerClass} />
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: brandColor + "20" }}
          >
            <CalendarCheck className="w-5 h-5" style={{ color: brandColor }} />
          </div>
          <div>
            <p
              className={cn(
                "text-sm font-semibold capitalize",
                embedded ? "text-foreground" : "text-white",
              )}
            >
              {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
            </p>
            <p
              className={cn(
                "text-xs",
                embedded ? "text-muted-foreground" : "text-zinc-400",
              )}
            >
              {selectedSlot.start_time} - {selectedSlot.end_time} (
              {slotDuration} min)
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onConfirm}
        disabled={isPending}
        className="w-full py-3.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ backgroundColor: brandColor }}
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Réservation en cours...
          </>
        ) : (
          <>
            <Check className="w-4 h-4" />
            Confirmer le rendez-vous
          </>
        )}
      </button>
    </motion.div>
  );
}

// ─── Step: Done ─────────────────────────────────────────────

function StepDone({
  brandColor,
  name,
  selectedDate,
  selectedSlot,
  embedded,
}: {
  brandColor: string;
  name: string;
  selectedDate: Date;
  selectedSlot: { start_time: string; end_time: string };
  embedded?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center py-12"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
        style={{ backgroundColor: brandColor + "20" }}
      >
        <Check className="w-8 h-8" style={{ color: brandColor }} />
      </div>
      <h2
        className={cn(
          "text-2xl font-bold mb-2",
          embedded ? "text-foreground" : "text-white",
        )}
      >
        Rendez-vous confirmé !
      </h2>
      <p
        className={cn(
          "mb-6",
          embedded ? "text-muted-foreground" : "text-zinc-400",
        )}
      >
        Merci {name.split(" ")[0]}, votre rendez-vous est bien enregistré.
      </p>
      <div
        className={cn(
          "inline-block rounded-2xl px-6 py-4",
          embedded
            ? "bg-surface border border-border"
            : "bg-zinc-900 border border-zinc-800",
        )}
      >
        <p
          className={cn(
            "text-sm font-semibold capitalize",
            embedded ? "text-foreground" : "text-white",
          )}
        >
          {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
        </p>
        <p
          className={cn(
            "text-sm mt-1",
            embedded ? "text-muted-foreground" : "text-zinc-400",
          )}
        >
          {selectedSlot.start_time} - {selectedSlot.end_time}
        </p>
      </div>
      <p
        className={cn(
          "text-xs mt-8",
          embedded ? "text-muted-foreground" : "text-zinc-500",
        )}
      >
        Vous recevrez un email de confirmation avec les détails du rendez-vous.
      </p>
    </motion.div>
  );
}
