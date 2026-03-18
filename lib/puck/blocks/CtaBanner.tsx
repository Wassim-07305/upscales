"use client";

import type { ComponentConfig } from "@measured/puck";
import { ColorField } from "../fields/ColorField";
import { useInView, FadeIn } from "../animations";
import { getContrastColor } from "../utils";

interface CtaBannerProps {
  heading: string;
  subtitle: string;
  ctaText: string;
  ctaUrl: string;
  note: string;
  accentColor: string;
}

function CtaBannerComponent({
  heading,
  subtitle,
  ctaText,
  ctaUrl,
  note,
  accentColor,
}: CtaBannerProps) {
  const { ref, isInView } = useInView();

  return (
    <section
      ref={ref}
      className="px-6 py-24 relative overflow-hidden"
    >
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 animate-gradient-shift"
        style={{
          background: `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}05 50%, ${accentColor}10 100%)`,
        }}
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <FadeIn isInView={isInView} delay={0}>
          <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-white">
            {heading}
          </h2>
        </FadeIn>

        {subtitle && (
          <FadeIn isInView={isInView} delay={100}>
            <p className="mt-4 text-lg text-gray-300">{subtitle}</p>
          </FadeIn>
        )}

        {ctaText && (
          <FadeIn isInView={isInView} delay={200}>
            <div className="mt-10">
              <a
                href={ctaUrl}
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 hover:scale-105 active:scale-[0.98] animate-glow-pulse"
                style={{
                  backgroundColor: accentColor,
                  color: getContrastColor(accentColor),
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
            </div>
          </FadeIn>
        )}

        {note && (
          <FadeIn isInView={isInView} delay={300}>
            <p className="mt-4 text-sm text-gray-400">{note}</p>
          </FadeIn>
        )}
      </div>
    </section>
  );
}

export const CtaBanner: ComponentConfig<CtaBannerProps> = {
  label: "Bannière CTA",
  fields: {
    heading: { type: "text", label: "Titre" },
    subtitle: { type: "textarea", label: "Sous-titre" },
    ctaText: { type: "text", label: "Texte du bouton" },
    ctaUrl: { type: "text", label: "Lien du bouton" },
    note: { type: "text", label: "Note (urgence)" },
    accentColor: {
      label: "Couleur d'accent",
      ...ColorField,
    },
  },
  defaultProps: {
    heading: "Prêt à scaler ?",
    subtitle:
      "Réserve ton appel stratégique gratuit et découvre ton plan de scaling personnalisé.",
    ctaText: "Réserver mon appel stratégique",
    ctaUrl: "#booking",
    note: "Places limitées — On n'accepte que 10 nouveaux clients par mois",
    accentColor: "#C6FF00",
  },
  render: (props) => <CtaBannerComponent {...props} />,
};
