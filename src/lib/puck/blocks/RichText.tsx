import type { ComponentConfig } from "@measured/puck";
import DOMPurify from "isomorphic-dompurify";

interface RichTextProps {
  content: string;
  maxWidth: string;
}

export const RichText: ComponentConfig<RichTextProps> = {
  label: "Texte riche",
  fields: {
    content: {
      type: "textarea",
      label: "Contenu HTML",
    },
    maxWidth: {
      type: "select",
      label: "Largeur max",
      options: [
        { label: "Petite (640px)", value: "640px" },
        { label: "Moyenne (768px)", value: "768px" },
        { label: "Grande (1024px)", value: "1024px" },
        { label: "Pleine largeur", value: "100%" },
      ],
    },
  },
  defaultProps: {
    content: "<p>Votre contenu ici...</p>",
    maxWidth: "768px",
  },
  render: ({ content, maxWidth }) => (
    <section className="px-6 py-12">
      <div
        className="mx-auto prose prose-invert prose-headings:font-display prose-a:text-[#C6FF00] max-w-none"
        style={{ maxWidth }}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
      />
    </section>
  ),
};
