import type { ComponentConfig } from "@measured/puck";
import { ColorField } from "../fields/ColorField";

interface CTAProps {
  heading: string;
  text: string;
  buttonText: string;
  buttonUrl: string;
  accentColor: string;
}

export const CTA: ComponentConfig<CTAProps> = {
  label: "Appel à l'action",
  fields: {
    heading: { type: "text", label: "Titre" },
    text: { type: "textarea", label: "Texte" },
    buttonText: { type: "text", label: "Texte du bouton" },
    buttonUrl: { type: "text", label: "Lien du bouton" },
    accentColor: {
      label: "Couleur d'accent",
      ...ColorField,
    },
  },
  defaultProps: {
    heading: "Prêt à passer à l'action ?",
    text: "Rejoignez des centaines de personnes qui ont déjà transformé leur carrière.",
    buttonText: "Démarrer maintenant",
    buttonUrl: "#",
    accentColor: "#C6FF00",
  },
  render: ({ heading, text, buttonText, buttonUrl, accentColor }) => (
    <section className="px-6 py-20">
      <div
        className="max-w-4xl mx-auto rounded-2xl p-12 text-center"
        style={{
          background: `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}05 100%)`,
          border: `1px solid ${accentColor}30`,
        }}
      >
        <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">{heading}</h2>
        {text && <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">{text}</p>}
        {buttonText && (
          <a
            href={buttonUrl}
            className="inline-flex items-center px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 hover:scale-105"
            style={{
              backgroundColor: accentColor,
              color: "#0D0D0D",
              boxShadow: `0 0 30px ${accentColor}30`,
            }}
          >
            {buttonText}
          </a>
        )}
      </div>
    </section>
  ),
};
