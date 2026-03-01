import type { ComponentConfig } from "@measured/puck";
import { ColorField } from "../fields/ColorField";
import { ImageUploadField } from "../fields/ImageUploadField";

interface HeroProps {
  headline: string;
  subtitle: string;
  ctaText: string;
  ctaUrl: string;
  secondaryCtaText: string;
  secondaryCtaUrl: string;
  backgroundImageUrl: string;
  alignment: string;
  accentColor: string;
}

export const Hero: ComponentConfig<HeroProps> = {
  label: "Héro",
  fields: {
    headline: { type: "text", label: "Titre principal" },
    subtitle: { type: "textarea", label: "Sous-titre" },
    ctaText: { type: "text", label: "Texte du bouton" },
    ctaUrl: { type: "text", label: "Lien du bouton" },
    secondaryCtaText: { type: "text", label: "Texte bouton secondaire" },
    secondaryCtaUrl: { type: "text", label: "Lien bouton secondaire" },
    backgroundImageUrl: {
      label: "Image de fond",
      ...ImageUploadField,
    },
    alignment: {
      type: "radio",
      label: "Alignement",
      options: [
        { label: "Gauche", value: "left" },
        { label: "Centre", value: "center" },
      ],
    },
    accentColor: {
      label: "Couleur d'accent",
      ...ColorField,
    },
  },
  defaultProps: {
    headline: "Transformez votre avenir",
    subtitle: "Rejoignez notre programme et développez les compétences qui feront la différence.",
    ctaText: "Commencer maintenant",
    ctaUrl: "#",
    secondaryCtaText: "",
    secondaryCtaUrl: "",
    backgroundImageUrl: "",
    alignment: "center",
    accentColor: "#C6FF00",
  },
  render: ({
    headline,
    subtitle,
    ctaText,
    ctaUrl,
    secondaryCtaText,
    secondaryCtaUrl,
    backgroundImageUrl,
    alignment,
    accentColor,
  }) => (
    <section
      className="relative min-h-[80vh] flex items-center overflow-hidden"
      style={
        backgroundImageUrl
          ? {
              backgroundImage: `linear-gradient(to bottom, rgba(13,13,13,0.7), rgba(13,13,13,0.9)), url(${backgroundImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : { background: "linear-gradient(135deg, #0D0D0D 0%, #1a1a2e 100%)" }
      }
    >
      <div
        className="w-full max-w-5xl mx-auto px-6 py-24"
        style={{ textAlign: alignment as "left" | "center" }}
      >
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6">
          {headline}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-10" style={alignment === "center" ? { marginInline: "auto" } : undefined}>
            {subtitle}
          </p>
        )}
        <div className="flex gap-4" style={alignment === "center" ? { justifyContent: "center" } : undefined}>
          {ctaText && (
            <a
              href={ctaUrl}
              className="inline-flex items-center px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 hover:scale-105"
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
              className="inline-flex items-center px-8 py-4 rounded-xl font-semibold text-base border border-white/20 text-white hover:bg-white/10 transition-all duration-300"
            >
              {secondaryCtaText}
            </a>
          )}
        </div>
      </div>
    </section>
  ),
};
