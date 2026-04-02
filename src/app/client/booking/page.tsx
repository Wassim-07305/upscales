"use client";

import { motion } from "framer-motion";
import {
  staggerContainer,
  fadeInUp,
  defaultTransition,
} from "@/lib/animations";
import { CalendarCheck, Loader2 } from "lucide-react";
import { useCoachBookingPage } from "@/hooks/use-booking-pages";
import { useAuth } from "@/hooks/use-auth";
import { BookingFlow } from "@/components/booking/BookingFlow";

export default function BookingPage() {
  const { data: page, isLoading } = useCoachBookingPage();
  const { profile } = useAuth();

  return (
    <motion.div
      variants={staggerContainer}
      initial="visible"
      animate="visible"
      className="max-w-2xl mx-auto space-y-6"
    >
      <motion.div variants={fadeInUp} transition={defaultTransition}>
        <h1 className="text-2xl font-display font-bold text-foreground tracking-tight flex items-center gap-2">
          <CalendarCheck className="w-6 h-6 text-primary" />
          Réserver un appel
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choisissez un créneau disponible avec votre coach
        </p>
      </motion.div>

      <motion.div
        variants={fadeInUp}
        transition={defaultTransition}
        className="bg-surface rounded-2xl p-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !page ? (
          <div className="text-center py-16">
            <CalendarCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Aucune page de réservation disponible pour l&apos;instant.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Votre coach n&apos;a pas encore configuré ses disponibilités.
            </p>
          </div>
        ) : (
          <BookingFlow
            page={page}
            embedded
            prefill={{
              name: profile?.full_name ?? "",
              email: profile?.email ?? "",
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
