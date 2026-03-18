"use client";

import type { ComponentConfig } from "@measured/puck";
import { ColorField } from "../fields/ColorField";
import { useInView, FadeIn } from "../animations";
import { getContrastColor } from "../utils";

interface PricingSingleProps {
  heading: string;
  subtitle: string;
  planName: string;
  priceText: string;
  tagline: string;
  features: string;
  ctaText: string;
  ctaUrl: string;
  accentColor: string;
}

function PricingSingleComponent({
  heading,
  subtitle,
  planName,
  priceText,
  tagline,
  features,
  ctaText,
  ctaUrl,
  accentColor,
}: PricingSingleProps) {
  const { ref, isInView } = useInView();

  return (
    <section ref={ref} className="px-6 py-20">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <FadeIn isInView={isInView} delay={0} className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            {heading}
          </h2>
          {subtitle && (
            <p className="text-lg text-gray-300">{subtitle}</p>
          )}
        </FadeIn>

        {/* Single plan card */}
        <div
          className="max-w-lg mx-auto rounded-2xl p-8 md:p-10 transition-all duration-700 animate-glow-pulse"
          style={{
            border: `1px solid ${accentColor}`,
            background: `${accentColor}08`,
            boxShadow: `0 0 60px ${accentColor}15`,
            opacity: isInView ? 1 : 0,
            transform: isInView ? "scale(1)" : "scale(0.95)",
          }}
        >
          <h3 className="text-xl font-semibold text-white mb-2">{planName}</h3>
          <div className="mb-2">
            <span
              className="text-3xl md:text-4xl font-display font-bold"
              style={{ color: accentColor }}
            >
              {priceText}
            </span>
          </div>
          {tagline && (
            <p className="text-sm text-gray-400 mb-8">{tagline}</p>
          )}

          <ul className="space-y-3 mb-8">
            {features
              .split("\n")
              .filter(Boolean)
              .map((feature, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-gray-300 transition-all duration-500"
                  style={{
                    opacity: isInView ? 1 : 0,
                    transform: isInView ? "translateX(0)" : "translateX(-12px)",
                    transitionDelay: `${400 + i * 50}ms`,
                  }}
                >
                  <span style={{ color: accentColor }}>✓</span>
                  <span>{feature}</span>
                </li>
              ))}
          </ul>

          {ctaText && (
            <a
              href={ctaUrl}
              className="block w-full text-center px-6 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: accentColor,
                color: getContrastColor(accentColor),
                boxShadow: `0 0 20px ${accentColor}25`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 0 50px ${accentColor}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = `0 0 20px ${accentColor}25`;
              }}
            >
              {ctaText}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

export const PricingSingle: ComponentConfig<PricingSingleProps> = {
  label: "Tarif unique",
  fields: {
    heading: { type: "text", label: "Titre" },
    subtitle: { type: "textarea", label: "Sous-titre" },
    planName: { type: "text", label: "Nom du plan" },
    priceText: { type: "text", label: "Prix (texte libre)" },
    tagline: { type: "text", label: "Tagline" },
    features: { type: "textarea", label: "Avantages (un par ligne)" },
    ctaText: { type: "text", label: "Texte du bouton" },
    ctaUrl: { type: "text", label: "Lien du bouton" },
    accentColor: {
      label: "Couleur d'accent",
      ...ColorField,
    },
  },
  defaultProps: {
    heading: "Investissement",
    subtitle: "",
    planName: "Programme Scaling 6 Mois",
    priceText: "Basé sur tes résultats",
    tagline:
      "Tu ne paies qu'en fonction des revenus que tu génères. Si tu ne gagnes rien, tu ne paies rien.",
    features:
      "1 appel stratégique par semaine en one-to-one\nAppels de groupe hebdomadaires avec la communauté\nPlan d'action quotidien personnalisé\nLooms d'audit personnalisés de ton business\nMessagerie vocale illimitée avec ton coach\nTracker de résultats et dashboard data\nAccès à la communauté privée\nFormation complète sur la délégation et le management\nAccompagnement sur 6 mois complet",
    ctaText: "Réserver mon appel stratégique",
    ctaUrl: "#booking",
    accentColor: "#C6FF00",
  },
  render: (props) => <PricingSingleComponent {...props} />,
};
