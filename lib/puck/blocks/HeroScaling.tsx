import type { ComponentConfig } from "@measured/puck";
import { ColorField } from "../fields/ColorField";

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
    headline: "Passe de freelance solo à une agence de 10+ personnes en 6 mois",
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
  render: ({
    headline,
    subtitle,
    ctaText,
    ctaUrl,
    secondaryCtaText,
    secondaryCtaUrl,
    badges,
    stats,
    accentColor,
  }) => (
    <section
      className="relative min-h-[90vh] flex items-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at center top, rgba(198,255,0,0.06) 0%, transparent 60%), linear-gradient(135deg, #0D0D0D 0%, #1a1a2e 100%)",
      }}
    >
      <div className="w-full max-w-5xl mx-auto px-6 py-24 text-center">
        {/* Badges */}
        {badges && badges.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            {badges.map((badge, i) => (
              <span
                key={i}
                className="rounded-full px-4 py-1.5 text-sm font-medium"
                style={{
                  border: `1px solid ${accentColor}40`,
                  backgroundColor: `${accentColor}10`,
                  color: accentColor,
                }}
              >
                {badge.text}
              </span>
            ))}
          </div>
        )}

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6">
          {headline}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            {subtitle}
          </p>
        )}

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          {ctaText && (
            <a
              href={ctaUrl}
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: accentColor,
                color: "#0D0D0D",
                boxShadow: `0 0 30px ${accentColor}30`,
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

        {/* Stats */}
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 border-t border-white/10">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p
                  className="text-3xl md:text-4xl font-display font-bold"
                  style={{ color: accentColor }}
                >
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  ),
};
