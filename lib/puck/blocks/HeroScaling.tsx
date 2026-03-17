"use client";

import type { ComponentConfig } from "@measured/puck";
import { ColorField } from "../fields/ColorField";
import { useInView, FadeIn, AnimatedCounter } from "../animations";

interface Badge {
  text: string;
}

interface Stat {
  value: string;
  label: string;
}

interface HeroScalingProps {
  headline: string;
  subtitle: string;
  ctaText: string;
  ctaUrl: string;
  secondaryCtaText: string;
  secondaryCtaUrl: string;
  badges: Badge[];
  stats: Stat[];
  accentColor: string;
}

function parseStatValue(value: string): { number: number; suffix: string } | null {
  const match = value.match(/^(\d+)(.*)/);
  if (!match) return null;
  return { number: parseInt(match[1], 10), suffix: match[2] };
}

function HeroScalingComponent({
  headline,
  subtitle,
  ctaText,
  ctaUrl,
  secondaryCtaText,
  secondaryCtaUrl,
  badges,
  stats,
  accentColor,
}: HeroScalingProps) {
  const { ref, isInView } = useInView(0.1);

  return (
    <section
      ref={ref}
      className="relative min-h-[90vh] flex items-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at center top, rgba(198,255,0,0.06) 0%, transparent 60%), linear-gradient(135deg, #0D0D0D 0%, #1a1a2e 100%)",
      }}
    >
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full blur-[140px] animate-float"
          style={{ backgroundColor: `${accentColor}0A` }}
        />
        <div
          className="absolute right-1/4 top-1/3 h-[250px] w-[250px] rounded-full blur-[100px] animate-float"
          style={{ backgroundColor: "rgba(127, 255, 212, 0.04)", animationDelay: "2s" }}
        />
      </div>

      <div className="relative w-full max-w-5xl mx-auto px-6 py-24 text-center">
        {/* Badges */}
        {badges && badges.length > 0 && (
          <FadeIn isInView={isInView} delay={0}>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              {badges.map((badge, i) => (
                <span
                  key={i}
                  className="rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-700"
                  style={{
                    border: `1px solid ${accentColor}40`,
                    backgroundColor: `${accentColor}10`,
                    color: accentColor,
                    opacity: isInView ? 1 : 0,
                    transform: isInView ? "translateY(0)" : "translateY(8px)",
                    transitionDelay: `${i * 100}ms`,
                  }}
                >
                  {badge.text}
                </span>
              ))}
            </div>
          </FadeIn>
        )}

        {/* Headline */}
        <FadeIn isInView={isInView} delay={150}>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6">
            {headline}
          </h1>
        </FadeIn>

        {/* Subtitle */}
        {subtitle && (
          <FadeIn isInView={isInView} delay={250}>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
              {subtitle}
            </p>
          </FadeIn>
        )}

        {/* CTA buttons */}
        <FadeIn isInView={isInView} delay={350}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {ctaText && (
              <a
                href={ctaUrl}
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 hover:scale-105 active:scale-[0.98]"
                style={{
                  backgroundColor: accentColor,
                  color: "#0D0D0D",
                  boxShadow: `0 0 30px ${accentColor}30`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 60px ${accentColor}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 30px ${accentColor}30`;
                }}
              >
                {ctaText}
              </a>
            )}
            {secondaryCtaText && (
              <a
                href={secondaryCtaUrl}
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold text-base border border-white/20 text-white hover:bg-white/10 transition-all duration-300"
              >
                {secondaryCtaText}
              </a>
            )}
          </div>
        </FadeIn>

        {/* Stats */}
        {stats && stats.length > 0 && (
          <FadeIn isInView={isInView} delay={450}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 border-t border-white/10">
              {stats.map((stat, i) => {
                const parsed = parseStatValue(stat.value);
                return (
                  <div
                    key={i}
                    className="text-center transition-all duration-700"
                    style={{
                      opacity: isInView ? 1 : 0,
                      transform: isInView ? "translateY(0)" : "translateY(12px)",
                      transitionDelay: `${500 + i * 150}ms`,
                    }}
                  >
                    <p
                      className="text-3xl md:text-4xl font-display font-bold"
                      style={{ color: accentColor }}
                    >
                      {parsed ? (
                        <AnimatedCounter
                          target={parsed.number}
                          suffix={parsed.suffix}
                          isInView={isInView}
                        />
                      ) : (
                        stat.value
                      )}
                    </p>
                    <p className="mt-1 text-sm text-gray-400">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </FadeIn>
        )}
      </div>
    </section>
  );
}

export const HeroScaling: ComponentConfig<HeroScalingProps> = {
  label: "Héro Scaling",
  fields: {
    headline: { type: "text", label: "Titre principal" },
    subtitle: { type: "textarea", label: "Sous-titre" },
    ctaText: { type: "text", label: "Texte du bouton principal" },
    ctaUrl: { type: "text", label: "Lien du bouton principal" },
    secondaryCtaText: { type: "text", label: "Texte bouton secondaire" },
    secondaryCtaUrl: { type: "text", label: "Lien bouton secondaire" },
    badges: {
      type: "array",
      label: "Badges de preuve sociale",
      arrayFields: {
        text: { type: "text", label: "Texte" },
      },
      getItemSummary: (item: Badge) => item.text || "Badge",
      defaultItemProps: {
        text: "Badge",
      },
    },
    stats: {
      type: "array",
      label: "Statistiques",
      arrayFields: {
        value: { type: "text", label: "Valeur (ex: 10x)" },
        label: { type: "text", label: "Label" },
      },
      getItemSummary: (item: Stat) => `${item.value} — ${item.label}`,
      defaultItemProps: {
        value: "10x",
        label: "Croissance",
      },
    },
    accentColor: {
      label: "Couleur d'accent",
      ...ColorField,
    },
  },
  defaultProps: {
    headline: "Rendre le scaling accessible a tous",
    subtitle:
      "Un accompagnement personnalisé pour scaler ton activité. Tu paies uniquement en fonction des revenus que tu génères.",
    ctaText: "Réserver mon appel stratégique",
    ctaUrl: "#booking",
    secondaryCtaText: "Voir les résultats",
    secondaryCtaUrl: "#temoignages",
    badges: [
      { text: "+200 freelances accompagnés" },
      { text: "Paiement au résultat" },
      { text: "6 mois d'accompagnement" },
    ],
    stats: [
      { value: "10x", label: "Croissance moyenne" },
      { value: "87%", label: "Taux de rétention" },
      { value: "6 mois", label: "Durée du programme" },
    ],
    accentColor: "#C6FF00",
  },
  render: (props) => <HeroScalingComponent {...props} />,
};
