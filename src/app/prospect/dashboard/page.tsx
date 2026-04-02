"use client";

import { motion } from "framer-motion";
import {
  Lock,
  GraduationCap,
  MessageSquare,
  Kanban,
  BarChart3,
  Trophy,
  Users,
  FileText,
  Bot,
  ClipboardCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { PageTransition } from "@/components/ui/page-transition";
import { staggerContainer, staggerItem, cardHover } from "@/lib/animations";

// Features verrouillees affichees sur le dashboard prospect
const lockedFeatures = [
  {
    name: "Formation",
    description: "Modules progressifs, quiz et certificats",
    icon: GraduationCap,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    name: "Messagerie",
    description: "Communication directe avec ton coach",
    icon: MessageSquare,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    name: "CRM",
    description: "Pipeline commercial et suivi clients",
    icon: Kanban,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    name: "Analytics",
    description: "KPIs et metriques de performance",
    icon: BarChart3,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    name: "Gamification",
    description: "Points XP, badges et classement",
    icon: Trophy,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    name: "Communaute",
    description: "Feed d'activite et entraide",
    icon: Users,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    name: "Formulaires",
    description: "Check-ins et suivis personnalises",
    icon: FileText,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    name: "Assistant IA",
    description: "AlexIA, ton coach intelligent",
    icon: Bot,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
  {
    name: "Suivi coaching",
    description: "Seances, objectifs et progression",
    icon: ClipboardCheck,
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
  },
];

export default function ProspectDashboardPage() {
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] ?? "Prospect";

  // Extraire un score diagnostic depuis onboarding_answers si dispo
  const diagnosticScore = profile?.onboarding_answers?.diagnostic_score
    ? Number(profile.onboarding_answers.diagnostic_score)
    : null;

  return (
    <PageTransition>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Welcome header */}
        <motion.div variants={staggerItem} className="space-y-1">
          <h1 className="text-[20px] font-bold tracking-[-0.02em] text-foreground font-[family-name:var(--font-heading)]">
            Bienvenue sur UPSCALE
          </h1>
          <p className="text-sm text-muted-foreground">
            Salut {firstName}, decouvre ce qui t&apos;attend.
          </p>
        </motion.div>

        {/* Diagnostic card */}
        <motion.div variants={staggerItem}>
          <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-2">
                <h2 className="text-base font-semibold text-foreground">
                  Ton diagnostic
                </h2>
                {diagnosticScore !== null ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Score obtenu lors de ton evaluation initiale
                    </p>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold text-foreground">
                        {diagnosticScore}
                      </span>
                      <span className="mb-1 text-sm text-muted-foreground">
                        / 100
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${diagnosticScore}%` }}
                        transition={{
                          duration: 1,
                          delay: 0.4,
                          ease: "easeOut",
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Tu n&apos;as pas encore passe le diagnostic. Contacte-nous
                    pour planifier ton evaluation.
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Locked features grid */}
        <motion.div variants={staggerItem} className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            Ce qui t&apos;attend avec l&apos;abonnement
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lockedFeatures.map((feature) => (
              <motion.div
                key={feature.name}
                variants={staggerItem}
                whileHover="hover"
                initial="rest"
              >
                <motion.div
                  variants={cardHover}
                  className="group relative overflow-hidden rounded-lg border border-border bg-surface p-5 shadow-sm"
                >
                  {/* Lock badge */}
                  <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>

                  {/* Icon */}
                  <div
                    className={`mb-3 flex h-10 w-10 items-center justify-center rounded-md ${feature.bgColor}`}
                  >
                    <feature.icon className={`h-5 w-5 ${feature.color}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-sm font-semibold text-foreground">
                    {feature.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Locked label */}
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
                    <Lock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Disponible avec l&apos;abonnement
                    </span>
                  </div>

                  {/* Subtle overlay on hover */}
                  <div className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-t from-primary/[0.03] to-transparent" />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div variants={staggerItem}>
          <div className="rounded-lg border border-border bg-gradient-to-r from-violet-500/5 via-indigo-500/5 to-blue-500/5 p-6 text-center">
            <h3 className="text-base font-semibold text-foreground">
              Pret a passer au niveau superieur ?
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Debloque l&apos;acces complet a la plateforme et commence ton
              accompagnement.
            </p>
            <a
              href="mailto:contact@upscale.fr"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Contactez-nous pour debloquer votre acces
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}
