import type { ComponentConfig } from "@measured/puck";
import { ColorField } from "../fields/ColorField";
import { ImageUploadField } from "../fields/ImageUploadField";

interface TextImageProps {
  heading: string;
  text: string;
  imageUrl: string;
  imagePosition: string;
  ctaText: string;
  ctaUrl: string;
  accentColor: string;
}

export const TextImage: ComponentConfig<TextImageProps> = {
  label: "Texte + Image",
  fields: {
    heading: { type: "text", label: "Titre" },
    text: { type: "textarea", label: "Texte" },
    imageUrl: {
      label: "Image",
      ...ImageUploadField,
    },
    imagePosition: {
      type: "radio",
      label: "Position de l'image",
      options: [
        { label: "Droite", value: "right" },
        { label: "Gauche", value: "left" },
      ],
    },
    ctaText: { type: "text", label: "Texte du bouton" },
    ctaUrl: { type: "text", label: "Lien du bouton" },
    accentColor: {
      label: "Couleur d'accent",
      ...ColorField,
    },
  },
  defaultProps: {
    heading: "Pourquoi nous choisir",
    text: "Notre approche unique combine théorie et pratique pour des résultats concrets et mesurables.",
    imageUrl: "",
    imagePosition: "right",
    ctaText: "",
    ctaUrl: "#",
    accentColor: "#C6FF00",
  },
  render: ({ heading, text, imageUrl, imagePosition, ctaText, ctaUrl, accentColor }) => (
    <section className="px-6 py-20">
      <div
        className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center"
        style={{ direction: imagePosition === "left" ? "rtl" : "ltr" }}
      >
        <div style={{ direction: "ltr" }}>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">{heading}</h2>
          <p className="text-lg text-gray-300 mb-8 leading-relaxed whitespace-pre-line">{text}</p>
          {ctaText && (
            <a
              href={ctaUrl}
              className="inline-flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: accentColor,
                color: "#0D0D0D",
              }}
            >
              {ctaText}
            </a>
          )}
        </div>
        <div style={{ direction: "ltr" }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={heading}
              className="rounded-2xl w-full object-cover shadow-2xl"
            />
          ) : (
            <div className="rounded-2xl w-full aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-gray-600">
              Image
            </div>
          )}
        </div>
      </div>
    </section>
  ),
};
