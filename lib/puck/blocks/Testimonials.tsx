import type { ComponentConfig } from "@measured/puck";
import { ImageUploadField } from "../fields/ImageUploadField";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  avatarUrl: string;
}

interface TestimonialsProps {
  heading: string;
  testimonials: Testimonial[];
}

export const Testimonials: ComponentConfig<TestimonialsProps> = {
  label: "Témoignages",
  fields: {
    heading: { type: "text", label: "Titre" },
    testimonials: {
      type: "array",
      label: "Témoignages",
      arrayFields: {
        quote: { type: "textarea", label: "Citation" },
        name: { type: "text", label: "Nom" },
        role: { type: "text", label: "Rôle / Entreprise" },
        avatarUrl: {
          label: "Photo",
          ...ImageUploadField,
        },
      },
      getItemSummary: (item: Testimonial) => item.name || "Témoignage",
      defaultItemProps: {
        quote: "Cette formation a changé ma vision du métier.",
        name: "Jean Dupont",
        role: "Entrepreneur",
        avatarUrl: "",
      },
    },
  },
  defaultProps: {
    heading: "Ce qu'ils en disent",
    testimonials: [
      {
        quote: "Une expérience transformante. Je recommande à 100%.",
        name: "Marie Laurent",
        role: "Directrice Marketing",
        avatarUrl: "",
      },
      {
        quote: "La qualité du contenu est exceptionnelle.",
        name: "Thomas Petit",
        role: "Développeur",
        avatarUrl: "",
      },
    ],
  },
  render: ({ heading, testimonials }) => (
    <section className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-14">{heading}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl p-8 border border-white/10 bg-white/[0.03]"
            >
              <p className="text-gray-300 mb-6 leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                {t.avatarUrl ? (
                  <img src={t.avatarUrl} alt={t.name} className="size-10 rounded-full object-cover" />
                ) : (
                  <div className="size-10 rounded-full bg-[#C6FF00]/20 flex items-center justify-center text-sm font-bold text-[#C6FF00]">
                    {t.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  ),
};
