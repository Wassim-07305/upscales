"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import type {
  PublicBookingPageData,
  AvailableSlot,
} from "@/lib/types/database";
import { BookingStepIndicator } from "@/components/booking/public/BookingStepIndicator";
import { QualificationForm } from "@/components/booking/public/QualificationForm";
import { DateSelector } from "@/components/booking/public/DateSelector";
import { TimeSlotPicker } from "@/components/booking/public/TimeSlotPicker";
import { BookingConfirmation } from "@/components/booking/public/BookingConfirmation";

interface BookingFormData {
  prospectName: string;
  prospectEmail: string;
  prospectPhone: string;
  qualificationAnswers: Record<string, string>;
}

interface BookingResult {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  prospect_name: string;
}

interface BookingClientProps {
  page: PublicBookingPageData;
}

export default function BookingClient({ page }: BookingClientProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<BookingFormData>({
    prospectName: "",
    prospectEmail: "",
    prospectPhone: "",
    qualificationAnswers: {},
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(
    null
  );

  const brandColor = page.brand_color || "#C6FF00";

  // ---- Fetcher : creneaux disponibles ----
  const fetchSlots = useCallback(
    async (date: Date) => {
      setSlotsLoading(true);
      setSelectedSlot(null);
      setSlots([]);

      const dateStr = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");

      try {
        const res = await fetch(
          `/api/booking/slots?slug=${encodeURIComponent(page.slug)}&date=${dateStr}`
        );
        const json = await res.json();

        if (!res.ok) {
          toast.error(json.error || "Impossible de charger les creneaux.");
          return;
        }

        setSlots(json.slots ?? []);
      } catch {
        toast.error("Erreur reseau. Veuillez reessayer.");
      } finally {
        setSlotsLoading(false);
      }
    },
    [page.slug]
  );

  // ---- Handlers ----
  const handleFormSubmit = () => {
    setStep(2);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    fetchSlots(date);
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedSlot) return;

    setBookingLoading(true);

    const dateStr = [
      selectedDate.getFullYear(),
      String(selectedDate.getMonth() + 1).padStart(2, "0"),
      String(selectedDate.getDate()).padStart(2, "0"),
    ].join("-");

    try {
      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: page.slug,
          date: dateStr,
          start_time: selectedSlot.start_time,
          prospect_name: formData.prospectName,
          prospect_email: formData.prospectEmail,
          prospect_phone: formData.prospectPhone || null,
          qualification_answers:
            Object.keys(formData.qualificationAnswers).length > 0
              ? formData.qualificationAnswers
              : null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Impossible de creer la reservation.");
        return;
      }

      setBookingResult(json.booking);
      setStep(3);
    } catch {
      toast.error("Erreur reseau. Veuillez reessayer.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
  };

  // ---- Render ----
  return (
    <div className="mesh-gradient bg-grid min-h-screen flex flex-col items-center px-4 py-12 sm:py-16">
      {/* En-tete : logo + titre */}
      <div className="flex flex-col items-center mb-8 animate-fade-up">
        {page.logo_url && (
          <div className="relative size-14 mb-3 rounded-xl overflow-hidden border border-[#2A2A2A] bg-[#141414]">
            <Image
              src={page.logo_url}
              alt=""
              fill
              className="object-contain p-1"
              unoptimized
            />
          </div>
        )}
        {page.title && (
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground text-center">
            {page.title}
          </h1>
        )}
        {page.description && (
          <p className="text-muted-foreground text-sm sm:text-base mt-2 text-center max-w-md">
            {page.description}
          </p>
        )}
      </div>

      {/* Indicateur d'etapes */}
      <div className="mb-8 animate-fade-up delay-1">
        <BookingStepIndicator currentStep={step} brandColor={brandColor} />
      </div>

      {/* Contenu principal */}
      <div className="w-full max-w-4xl animate-fade-up delay-2">
        {step === 1 && (
          <div className="max-w-xl mx-auto">
            <QualificationForm
              qualificationFields={page.qualification_fields}
              formData={formData}
              onChange={setFormData}
              onSubmit={handleFormSubmit}
              loading={false}
            />
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <DateSelector
                selectedDate={selectedDate}
                onSelectDate={handleDateSelect}
                maxDaysAhead={page.max_days_ahead}
                brandColor={brandColor}
              />
            </div>
            <div>
              <TimeSlotPicker
                slots={slots}
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
                onConfirm={handleConfirmBooking}
                loading={slotsLoading}
                bookingLoading={bookingLoading}
                brandColor={brandColor}
                selectedDate={selectedDate}
              />
            </div>
            {/* Bouton retour */}
            <div className="lg:col-span-2">
              <button
                onClick={handleBack}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                &larr; Retour aux informations
              </button>
            </div>
          </div>
        )}

        {step === 3 && bookingResult && (
          <div className="max-w-md mx-auto">
            <BookingConfirmation
              bookingResult={bookingResult}
              pageTitle={page.title}
              brandColor={brandColor}
            />
          </div>
        )}
      </div>
    </div>
  );
}
