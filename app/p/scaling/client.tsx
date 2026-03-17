"use client";

import Link from "next/link";
import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  Users,
  GraduationCap,
  MessageCircle,
  Video,
  Trophy,
  BarChart3,
  ArrowRight,
  TrendingUp,
  Star,
  Menu,
  X,
  Shield,
  Clock,
  Zap,
  UserPlus,
  Compass,
  Rocket,
  Check,
  Quote,
  Flame,
  Target,
  LineChart,
  Sparkles,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Hooks & helpers                                                    */
/* ------------------------------------------------------------------ */

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el);
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, isInView };
}

function FadeIn({
  children,
  className = "",
  delay = 0,
  isInView,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  isInView: boolean;
}) {
  return (
    <div
      className={`transition-all duration-700 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function AnimatedCounter({
  target,
  suffix,
  isInView,
}: {
  target: number;
  suffix: string;
  isInView: boolean;
}) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isInView) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(target);
      return;
    }
    let frame: number;
    const duration = 2000;
    const start = performance.now();
    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [isInView, target]);
  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const ACCENT = "#C6FF00";
const ACCENT_LIGHT = "#B8E600";
const ACCENT_GLOW = "rgba(198, 255, 0, 0.12)";

const navLinks = [
  { label: "L'accompagnement", href: "#features" },
  { label: "Comment ça marche", href: "#how-it-works" },
  { label: "Pourquoi Upscale", href: "#why" },
  { label: "Témoignages", href: "#testimonials" },
];

const stats = [
  { value: 35, suffix: "+", label: "Freelances accompagnés" },
  { value: 10, suffix: "K", label: "Objectif CA mensuel" },
  { value: 97, suffix: "%", label: "De satisfaction" },
];

const features = [
  {
    icon: GraduationCap,
    title: "Formation complète",
    desc: "Modules structurés étape par étape : marché, offre, communication, acquisition, conversion. Avance à ton rythme.",
    gradient: "from-lime-400/20 to-lime-400/5",
  },
  {
    icon: Video,
    title: "Appels coaching",
    desc: "Appels vidéo intégrés avec ton coach, transcription automatique et documents générés après chaque session.",
    gradient: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    icon: MessageCircle,
    title: "Messagerie directe",
    desc: "Échange avec ton coach et la communauté en temps réel. Canaux dédiés, système urgent et réponses rapides.",
    gradient: "from-cyan-500/20 to-cyan-500/5",
  },
  {
    icon: Users,
    title: "Communauté",
    desc: "Rejoins des freelances qui partagent tes objectifs. Wins, entraide, challenges et lives exclusifs chaque semaine.",
    gradient: "from-violet-500/20 to-violet-500/5",
  },
  {
    icon: Trophy,
    title: "Gamification",
    desc: "XP, badges, leaderboard et challenges pour rester motivé. Célèbre tes victoires et progresse avec les autres.",
    gradient: "from-amber-500/20 to-amber-500/5",
  },
  {
    icon: BarChart3,
    title: "Suivi de progression",
    desc: "Dashboard personnel avec tes KPIs, ta roadmap et tes objectifs. Sache toujours où tu en es et ce qu'il te reste à faire.",
    gradient: "from-teal-500/20 to-teal-500/5",
  },
];

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "Rejoins le programme",
    desc: "Crée ton compte, découvre la plateforme avec un onboarding guidé et fais connaissance avec ton coach.",
  },
  {
    icon: Compass,
    number: "02",
    title: "Suis ta formation",
    desc: "Avance dans les modules à ton rythme, complète les workbooks et échange avec ton coach à chaque étape.",
  },
  {
    icon: Rocket,
    number: "03",
    title: "Atteins tes objectifs",
    desc: "Applique ce que tu apprends, suis ta progression et dépasse les 10K€/mois avec un accompagnement sur mesure.",
  },
];

const valueProps = [
  {
    icon: Target,
    title: "Tout au même endroit",
    desc: "Formation, coaching, messagerie, appels, communauté — tout est réuni dans ton espace Upscale. Plus besoin de jongler entre 10 outils.",
    items: [
      "Accès à tout depuis un seul endroit",
      "Expérience fluide et intuitive",
      "Impression pro dès la première seconde",
    ],
  },
  {
    icon: LineChart,
    title: "Un suivi personnalisé",
    desc: "Ton coach suit ta progression en temps réel. Il sait exactement où tu en es, ce qui te bloque et comment t'aider à avancer.",
    items: [
      "Roadmap personnalisée par l'IA",
      "Alertes automatiques si tu décroches",
      "Check-ins réguliers avec ton coach",
    ],
  },
  {
    icon: Flame,
    title: "Une communauté qui pousse",
    desc: "Tu n'es pas seul. Échange avec des freelances qui vivent la même chose, partage tes wins et reste motivé au quotidien.",
    items: [
      "Challenges hebdomadaires",
      "Leaderboard et badges",
      "Lives et replays exclusifs",
    ],
  },
];

const testimonials = [
  {
    name: "Marie L.",
    role: "Freelance copywriting",
    text: "En 3 mois d'accompagnement, j'ai structuré mon offre, trouvé mes premiers clients récurrents et dépassé les 6K€/mois. La plateforme est incroyablement bien faite.",
    rating: 5,
    metric: "6K€/mois en 3 mois",
  },
  {
    name: "Julien R.",
    role: "Consultant SEO",
    text: "Ce qui m'a le plus aidé c'est la communauté et les challenges. On se tire tous vers le haut. Mon coach m'a aidé à clarifier mon positionnement et ça a tout changé.",
    rating: 5,
    metric: "Offre repositionnée",
  },
  {
    name: "Sophie D.",
    role: "Freelance graphiste",
    text: "J'avais du mal à me vendre. Grâce aux modules sur l'offre et au suivi personnalisé, j'ai compris comment me positionner. Aujourd'hui je refuse des missions.",
    rating: 5,
    metric: "Plus de clients que de dispo",
  },
];

const footerSections = [
  {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", href: "#features" },
      { label: "Pourquoi Upscale", href: "#why" },
      { label: "Témoignages", href: "#testimonials" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { label: "Documentation", href: "/documentation" },
      { label: "Contact", href: "mailto:hello@upscale.fr" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "CGV", href: "/cgv" },
      { label: "Mentions légales", href: "/mentions-legales" },
      { label: "Confidentialité", href: "/confidentialite" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Dashboard Mockup                                                   */
/* ------------------------------------------------------------------ */

function DashboardMockup() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-px shadow-2xl">
      <div className="overflow-hidden rounded-[15px] bg-[#0F0E0C]">
        {/* Browser bar */}
        <div className="flex items-center gap-2 border-b border-white/[0.04] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-red-500/60" />
            <span className="size-2.5 rounded-full bg-amber-500/60" />
            <span className="size-2.5 rounded-full bg-green-500/60" />
          </div>
          <div className="ml-3 flex-1 rounded-md bg-white/[0.04] px-3 py-1 text-[11px] text-white/30">
            app.upscale.fr/dashboard
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3 p-4">
          {/* Sidebar */}
          <div className="col-span-2 hidden space-y-2 lg:block">
            <div className="h-3 w-16 rounded" style={{ backgroundColor: `${ACCENT}30` }} />
            <div className="mt-4 space-y-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2.5 rounded ${i === 0 ? "w-full" : "w-3/4 bg-white/[0.04]"}`}
                  style={i === 0 ? { backgroundColor: `${ACCENT}20` } : undefined}
                />
              ))}
            </div>
          </div>

          {/* Main */}
          <div className="col-span-12 space-y-3 lg:col-span-10">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {["Élèves", "Progression", "Revenue", "Sessions"].map(
                (label, i) => (
                  <div
                    key={label}
                    className={`rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5 ${i === 3 ? "hidden sm:block" : ""}`}
                  >
                    <div className="text-[9px] text-white/30">{label}</div>
                    <div className="mt-1 text-sm font-bold text-white/80">
                      {["32", "78%", "24.5k", "156"][i]}
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <div className="h-1 flex-1 rounded-full bg-white/[0.04]">
                        <div
                          className="h-1 rounded-full"
                          style={{
                            width: `${[85, 78, 65, 72][i]}%`,
                            backgroundColor: `${ACCENT}60`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>

            {/* Chart */}
            <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[10px] font-medium text-white/40">
                  Chiffre d&apos;affaires
                </div>
                <div className="flex gap-2">
                  <div className="h-1.5 w-6 rounded" style={{ backgroundColor: `${ACCENT}50` }} />
                  <div className="h-1.5 w-6 rounded bg-emerald-500/30" />
                </div>
              </div>
              <div className="flex h-16 items-end gap-1 sm:h-24">
                {[30, 45, 35, 60, 50, 72, 55, 80, 65, 88, 75, 95].map(
                  (h, i) => (
                    <div key={i} className="flex flex-1 flex-col gap-0.5">
                      <div
                        className="rounded-t transition-all duration-500"
                        style={{ height: `${h}%`, backgroundColor: `${ACCENT}40` }}
                      />
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Pipeline */}
            <div className="grid grid-cols-3 gap-2">
              {["Onboarding", "Active", "Consolidation"].map((col, ci) => (
                <div
                  key={col}
                  className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-2"
                >
                  <div className="mb-2 text-[9px] font-medium text-white/30">
                    {col}
                  </div>
                  {[...Array(ci === 0 ? 3 : ci === 1 ? 4 : 2)].map((_, j) => (
                    <div
                      key={j}
                      className="mb-1.5 rounded border border-white/[0.04] bg-white/[0.03] p-1.5"
                    >
                      <div className="h-1.5 w-3/4 rounded bg-white/[0.08]" />
                      <div className="mt-1 h-1 w-1/2 rounded bg-white/[0.04]" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ScalingPageClient() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const statsSection = useInView(0.3);
  const featuresSection = useInView(0.1);
  const howSection = useInView(0.1);
  const whySection = useInView(0.1);
  const testimonialsSection = useInView(0.1);
  const ctaSection = useInView(0.2);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white antialiased selection:bg-lime-900 selection:text-lime-100">
      {/* Dot grid */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* ================================================================ */}
      {/*  NAVIGATION                                                       */}
      {/* ================================================================ */}
      <nav
        className={`fixed top-0 z-50 w-full transition-all duration-500 ${
          scrolled
            ? "border-b border-white/10 bg-[#0D0D0D]/80 backdrop-blur-2xl backdrop-saturate-150"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-lg font-bold tracking-tight text-white font-display">
              Upscale
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-gray-400 transition-colors duration-200 hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:inline-flex">
              <button
                type="button"
                className="h-9 rounded-lg px-4 text-[13px] font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                Connexion
              </button>
            </Link>
            <Link href="/register" className="hidden sm:inline-flex">
              <button
                type="button"
                className="flex h-9 items-center gap-1.5 rounded-lg px-4 text-[13px] font-semibold text-[#0D0D0D] transition-all duration-200 hover:shadow-[0_0_24px_rgba(198,255,0,0.25)]"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_LIGHT})`,
                }}
              >
                Commencer
                <ArrowRight className="size-3.5" />
              </button>
            </Link>

            {/* Mobile toggle */}
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/5 hover:text-white md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`overflow-hidden border-t border-white/10 bg-[#0D0D0D]/98 backdrop-blur-2xl transition-all duration-300 md:hidden ${
            mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <button
                  type="button"
                  className="w-full rounded-lg py-2.5 text-center text-[15px] font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  Connexion
                </button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-[15px] font-semibold text-[#0D0D0D] transition-colors"
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_LIGHT})`,
                  }}
                >
                  Commencer
                  <ArrowRight className="size-3.5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* ============================================================== */}
        {/*  1. HERO                                                        */}
        {/* ============================================================== */}
        <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-44 lg:pb-36">
          {/* Orbs */}
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
          >
            <div className="absolute left-1/2 top-0 h-[700px] w-[1000px] -translate-x-1/2 rounded-full blur-[160px]" style={{ backgroundColor: `${ACCENT}0A` }} />
            <div className="absolute right-1/4 top-1/4 h-[300px] w-[300px] rounded-full blur-[100px]" style={{ backgroundColor: "rgba(127,255,212,0.04)" }} />
            <div className="absolute left-1/4 top-1/3 h-[250px] w-[250px] rounded-full blur-[120px]" style={{ backgroundColor: `${ACCENT}06` }} />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              {/* Badge */}
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[13px] font-medium text-gray-400 backdrop-blur-sm">
                <span
                  className="flex size-1.5 rounded-full"
                  style={{
                    backgroundColor: ACCENT,
                    boxShadow: `0 0 8px ${ACCENT_GLOW}`,
                  }}
                />
                L&apos;accompagnement business par Upscale
              </div>

              {/* Headline */}
              <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white font-display sm:text-[3.5rem] lg:text-[4rem]">
                Atteins{" "}
                <span className="relative inline-block whitespace-nowrap">
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_LIGHT}, ${ACCENT})`,
                    }}
                  >
                    10K&euro;/mois
                  </span>
                  <span
                    className="absolute -bottom-1 left-0 h-px w-full"
                    style={{
                      backgroundImage: `linear-gradient(to right, transparent, ${ACCENT}66, transparent)`,
                    }}
                    aria-hidden="true"
                  />
                </span>{" "}
                en freelance
              </h1>

              {/* Subheadline */}
              <p className="mx-auto mt-6 max-w-xl text-[1.125rem] leading-relaxed text-gray-400 sm:text-lg">
                Formation, coaching personnalisé, communauté et outils business
                réunis dans un seul espace. L&apos;accompagnement complet pour
                structurer et scaler ton activité.
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/register">
                  <button
                    type="button"
                    className="group flex h-12 items-center gap-2 rounded-xl px-7 text-[15px] font-semibold text-[#0D0D0D] transition-all duration-300 hover:shadow-[0_0_60px_rgba(198,255,0,0.25)] active:scale-[0.98]"
                    style={{
                      background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_LIGHT})`,
                      boxShadow: `0 0 40px ${ACCENT_GLOW}, 0 1px 2px rgba(0,0,0,0.2)`,
                    }}
                  >
                    Rejoindre le programme
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                </Link>
                <a href="#features">
                  <button
                    type="button"
                    className="h-12 rounded-xl border border-white/20 bg-white/5 px-7 text-[15px] font-medium text-gray-300 transition-all duration-200 hover:border-white/30 hover:bg-white/10 hover:text-white"
                  >
                    Découvrir l&apos;accompagnement
                  </button>
                </a>
              </div>

              {/* Trust pills */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-[13px] text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Shield className="size-3.5" />
                  Accompagnement premium
                </span>
                <span className="h-3 w-px bg-white/20" aria-hidden="true" />
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  Setup en 5 min
                </span>
                <span className="h-3 w-px bg-white/20" aria-hidden="true" />
                <span className="flex items-center gap-1.5">
                  <Zap className="size-3.5" />
                  Données sécurisées RGPD
                </span>
              </div>
            </div>

            {/* Mockup */}
            <div className="mx-auto mt-16 max-w-4xl sm:mt-20">
              <DashboardMockup />
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/*  2. STATS                                                       */}
        {/* ============================================================== */}
        <section
          ref={statsSection.ref}
          className="relative border-y border-white/10 py-16 sm:py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <p className="mb-10 text-center text-[13px] font-medium uppercase tracking-[0.15em] text-gray-500">
              Ils ont rejoint l&apos;accompagnement Upscale
            </p>
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
              {stats.map((stat, i) => (
                <div key={stat.label} className="text-center">
                  <div
                    className={`text-4xl font-bold tracking-tight font-display sm:text-5xl transition-all duration-700 ${
                      statsSection.isInView
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4"
                    }`}
                    style={{ transitionDelay: `${i * 150}ms`, color: ACCENT }}
                  >
                    <AnimatedCounter
                      target={stat.value}
                      suffix={stat.suffix}
                      isInView={statsSection.isInView}
                    />
                  </div>
                  <div
                    className={`mt-2 text-[13px] font-medium tracking-wide text-gray-500 uppercase transition-all duration-700 ${
                      statsSection.isInView
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4"
                    }`}
                    style={{ transitionDelay: `${i * 150 + 100}ms` }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/*  3. FEATURES                                                    */}
        {/* ============================================================== */}
        <section
          id="features"
          ref={featuresSection.ref}
          className="scroll-mt-20 py-24 sm:py-32 lg:py-40"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <FadeIn
              isInView={featuresSection.isInView}
              className="mx-auto max-w-2xl text-center"
            >
              <p
                className="mb-4 text-[13px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: `${ACCENT}B3` }}
              >
                Fonctionnalités
              </p>
              <h2 className="text-3xl font-bold tracking-tight font-display sm:text-4xl lg:text-[2.75rem]">
                Tout ce dont tu as besoin,
                <br className="hidden sm:block" />
                <span className="text-gray-500">dans un seul endroit</span>
              </h2>
              <p className="mt-5 text-base leading-relaxed text-gray-400 sm:text-lg">
                L&apos;accompagnement Upscale réunit tout ce qu&apos;il te
                faut pour passer de 0 à 10K&euro;/mois en freelance.
              </p>
            </FadeIn>

            <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:mt-20 lg:grid-cols-3">
              {features.map((feature, i) => (
                <article
                  key={feature.title}
                  className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-all duration-500 hover:border-white/20 hover:bg-white/[0.06] hover:scale-[1.02] hover:shadow-lg sm:p-8 ${
                    featuresSection.isInView
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <div
                    className={`pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br ${feature.gradient} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100`}
                    aria-hidden="true"
                  />
                  <div className="relative">
                    <div
                      className="mb-5 flex size-10 items-center justify-center rounded-lg transition-colors duration-300"
                      style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
                    >
                      <feature.icon className="size-5" />
                    </div>
                    <h3 className="text-[15px] font-semibold tracking-tight text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-2.5 text-[14px] leading-relaxed text-gray-400">
                      {feature.desc}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/*  4. HOW IT WORKS                                                */}
        {/* ============================================================== */}
        <section
          id="how-it-works"
          ref={howSection.ref}
          className="scroll-mt-20 border-y border-white/10 bg-white/[0.02] py-24 sm:py-32 lg:py-40"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <FadeIn
              isInView={howSection.isInView}
              className="mx-auto max-w-2xl text-center"
            >
              <p
                className="mb-4 text-[13px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: `${ACCENT}B3` }}
              >
                Comment ça marche
              </p>
              <h2 className="text-3xl font-bold tracking-tight font-display sm:text-4xl">
                Opérationnel en <span className="text-gray-500">3 étapes</span>
              </h2>
              <p className="mt-5 text-base leading-relaxed text-gray-400 sm:text-lg">
                De la configuration au scaling, tout est fluide et intuitif.
              </p>
            </FadeIn>

            <div className="relative mt-16 grid grid-cols-1 gap-6 md:grid-cols-3 lg:mt-20">
              <div
                className="pointer-events-none absolute top-16 left-[16.66%] hidden h-px w-[66.66%] md:block"
                aria-hidden="true"
                style={{
                  backgroundImage: `linear-gradient(to right, ${ACCENT}33, ${ACCENT}1A, ${ACCENT}33)`,
                }}
              />

              {steps.map((step, i) => (
                <FadeIn
                  key={step.number}
                  isInView={howSection.isInView}
                  delay={i * 120}
                  className="relative text-center"
                >
                  <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] shadow-sm">
                    <step.icon className="size-6" style={{ color: `${ACCENT}B3` }} />
                  </div>
                  <div
                    className="mb-3 text-[12px] font-bold tracking-[0.2em]"
                    style={{ color: `${ACCENT}80` }}
                  >
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-white">
                    {step.title}
                  </h3>
                  <p className="mx-auto mt-2.5 max-w-xs text-[14px] leading-relaxed text-gray-400">
                    {step.desc}
                  </p>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/*  5. POURQUOI UPSCALE                                            */}
        {/* ============================================================== */}
        <section
          id="why"
          ref={whySection.ref}
          className="scroll-mt-20 py-24 sm:py-32 lg:py-40"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <FadeIn
              isInView={whySection.isInView}
              className="mx-auto max-w-2xl text-center"
            >
              <p
                className="mb-4 text-[13px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: `${ACCENT}B3` }}
              >
                Pourquoi Upscale
              </p>
              <h2 className="text-3xl font-bold tracking-tight font-display sm:text-4xl">
                Plus qu&apos;un outil,{" "}
                <span className="text-gray-500">un avantage compétitif</span>
              </h2>
              <p className="mt-5 text-base leading-relaxed text-gray-400 sm:text-lg">
                Tu mérites mieux qu&apos;un patchwork de SaaS génériques.
              </p>
            </FadeIn>

            <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3 lg:mt-20">
              {valueProps.map((vp, i) => (
                <article
                  key={vp.title}
                  className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-all duration-500 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-lg sm:p-8 ${
                    whySection.isInView
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div
                    className="mb-5 flex size-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
                  >
                    <vp.icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-white">
                    {vp.title}
                  </h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-gray-400">
                    {vp.desc}
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {vp.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-[13px] text-gray-400"
                      >
                        <Check className="mt-0.5 size-3.5 shrink-0" style={{ color: `${ACCENT}99` }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/*  6. TESTIMONIALS                                                */}
        {/* ============================================================== */}
        <section
          id="testimonials"
          ref={testimonialsSection.ref}
          className="scroll-mt-20 border-y border-white/10 bg-white/[0.02] py-24 sm:py-32 lg:py-40"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <FadeIn
              isInView={testimonialsSection.isInView}
              className="mx-auto max-w-2xl text-center"
            >
              <p
                className="mb-4 text-[13px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: `${ACCENT}B3` }}
              >
                Témoignages
              </p>
              <h2 className="text-3xl font-bold tracking-tight font-display sm:text-4xl">
                Ils ont transformé leur activité
              </h2>
              <p className="mt-5 text-base leading-relaxed text-gray-400 sm:text-lg">
                Découvre les retours de freelances qui ont rejoint
                l&apos;accompagnement Upscale.
              </p>
            </FadeIn>

            <div className="mt-16 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3 lg:mt-20">
              {testimonials.map((t, i) => (
                <article
                  key={t.name}
                  className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-all duration-500 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-lg sm:p-8 ${
                    testimonialsSection.isInView
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  {/* Metric badge */}
                  <div
                    className="mb-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium"
                    style={{
                      backgroundColor: `${ACCENT}20`,
                      color: ACCENT,
                      border: `1px solid ${ACCENT}40`,
                    }}
                  >
                    <TrendingUp className="size-3" />
                    {t.metric}
                  </div>

                  <div className="mb-4 flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, idx) => (
                      <Star
                        key={idx}
                        className="size-3.5 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>

                  <blockquote className="text-[14px] leading-relaxed text-gray-400">
                    <Quote className="mb-2 size-4 text-gray-600" />
                    {t.text}
                  </blockquote>

                  <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                    <div className="flex size-9 items-center justify-center rounded-full text-[13px] font-semibold" style={{ backgroundColor: `${ACCENT}20`, color: ACCENT }}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-white">
                        {t.name}
                      </div>
                      <div className="text-[12px] text-gray-500">{t.role}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/*  7. CTA FINAL                                                   */}
        {/* ============================================================== */}
        <section
          ref={ctaSection.ref}
          className="relative overflow-hidden py-24 sm:py-32 lg:py-40"
        >
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
          >
            <div
              className="absolute left-1/2 bottom-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-[160px]"
              style={{ backgroundColor: `${ACCENT}0C` }}
            />
          </div>
          <FadeIn
            isInView={ctaSection.isInView}
            className="relative mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8"
          >
            <div className="mb-6 inline-flex items-center justify-center">
              <Sparkles className="size-6" style={{ color: `${ACCENT}99` }} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight font-display sm:text-4xl lg:text-5xl">
              Prêt à passer au
              <br />
              <span className="text-gray-500">niveau supérieur</span> ?
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-gray-400 sm:text-lg">
              Rejoins l&apos;accompagnement Upscale et commence à construire
              ton activité rentable dès aujourd&apos;hui.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4">
              <Link href="/register">
                <button
                  type="button"
                  className="group flex h-13 items-center gap-2 rounded-xl px-10 text-[15px] font-semibold text-[#0D0D0D] transition-all duration-300 hover:shadow-[0_0_60px_rgba(198,255,0,0.25)] active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_LIGHT})`,
                    boxShadow: `0 0 40px ${ACCENT_GLOW}`,
                  }}
                >
                  Rejoindre le programme
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              </Link>
              <span className="text-[13px] text-gray-500">
                Places limitées — sur candidature uniquement
              </span>
            </div>
          </FadeIn>
        </section>
      </main>

      {/* ================================================================ */}
      {/*  8. FOOTER                                                        */}
      {/* ================================================================ */}
      <footer className="border-t border-white/10 bg-[#0A0A0A] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="text-[15px] font-bold text-white font-display">
                  Upscale
                </span>
              </Link>
              <p className="mt-4 max-w-[220px] text-[13px] leading-relaxed text-white/50">
                L&apos;accompagnement business pour les
                freelances qui visent les 10K&euro;/mois.
              </p>
            </div>

            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-white/40">
                  {section.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-[13px] text-white/50 transition-colors duration-200 hover:text-white/70"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-14 border-t border-white/[0.08] pt-8 text-center text-[12px] text-white/45">
            &copy; {new Date().getFullYear()} Upscale. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
