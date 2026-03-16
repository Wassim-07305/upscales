import type { ComponentConfig } from "@measured/puck";
import { ColorField } from "../fields/ColorField";

interface CtaBannerProps {
  heading: string;
  subtitle: string;
  ctaText: string;
  ctaUrl: string;
  note: string;
  accentColor: string;
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
  render: ({ heading, subtitle, ctaText, ctaUrl, note, accentColor }) => (
    <section
      className="px-6 py-24"
      style={{
        background: `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}05 100%)`,
      }}
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-white">
          {heading}
        </h2>

        {subtitle && (
          <p className="mt-4 text-lg text-gray-300">{subtitle}</p>
        )}

        {ctaText && (
          <div className="mt-10">
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
          </div>
        )}

        {note && (
          <p className="mt-4 text-sm text-gray-400">{note}</p>
        )}
      </div>
    </section>
  ),
};
