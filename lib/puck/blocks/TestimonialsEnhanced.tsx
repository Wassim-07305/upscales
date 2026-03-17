"use client";

import type { ComponentConfig } from "@measured/puck";
import { ColorField } from "../fields/ColorField";
import { useInView, FadeIn } from "../animations";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  badge: string;
}

interface TestimonialsEnhancedProps {
  heading: string;
  subtitle: string;
  testimonials: Testimonial[];
  accentColor: string;
}

const AVATAR_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
];

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash += name.charCodeAt(i);
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function TestimonialsEnhancedComponent({
  heading,
  subtitle,
  testimonials,
  accentColor,
}: TestimonialsEnhancedProps) {
  const { ref, isInView } = useInView();

  return (
    <section ref={ref} className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <FadeIn isInView={isInView} delay={0} className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            {heading}
          </h2>
          {subtitle && (
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </FadeIn>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => {
            const initial = testimonial.name.charAt(0).toUpperCase();
            const avatarColor = getColorFromName(testimonial.name);

            return (
              <div
                key={index}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{
                  opacity: isInView ? 1 : 0,
                  transform: isInView ? "translateY(0)" : "translateY(24px)",
                  transition: "all 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
                  transitionDelay: `${index * 100}ms`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${accentColor}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                }}
              >
                {/* Badge */}
                {testimonial.badge && (
                  <div className="mb-4">
                    <span
                      className="inline-block text-xs font-bold px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: `${accentColor}20`,
                        color: accentColor,
                      }}
                    >
                      {testimonial.badge}
                    </span>
                  </div>
                )}

                {/* Quote */}
                <p className="text-gray-300 italic leading-relaxed flex-1">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                {/* Footer */}
                <div className="mt-6 flex items-center gap-3">
                  {/* Avatar */}
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export const TestimonialsEnhanced: ComponentConfig<TestimonialsEnhancedProps> = {
  label: "Témoignages (avec résultats)",
  fields: {
    heading: { type: "text", label: "Titre" },
    subtitle: { type: "textarea", label: "Sous-titre" },
    testimonials: {
      type: "array",
      label: "Témoignages",
      arrayFields: {
        quote: { type: "textarea", label: "Citation" },
        name: { type: "text", label: "Nom" },
        role: { type: "text", label: "Rôle / Métier" },
        badge: { type: "text", label: "Badge résultat (ex: CA x3)" },
      },
      getItemSummary: (item: Testimonial) => item.name || "Témoignage",
      defaultItemProps: {
        quote: "Témoignage du client.",
        name: "Nom",
        role: "Rôle",
        badge: "",
      },
    },
    accentColor: {
      label: "Couleur d'accent",
      ...ColorField,
    },
  },
  defaultProps: {
    heading: "Ils ont scalé avec nous",
    subtitle: "Des résultats concrets pour des freelances ambitieux.",
    testimonials: [
      {
        quote:
          "En 4 mois, je suis passé de freelance solo à une agence de 5 personnes. Le plan d'action quotidien a tout changé.",
        name: "Thomas Durand",
        role: "Fondateur, agence web",
        badge: "CA x3 en 4 mois",
      },
      {
        quote:
          "Le coaching one-to-one m'a permis de structurer mon offre et de déléguer. Je gère maintenant une équipe de 8 personnes.",
        name: "Sarah Lefèvre",
        role: "Directrice, studio design",
        badge: "+8 collaborateurs",
      },
      {
        quote:
          "Le modèle de paiement au résultat m'a convaincu. Zéro risque, et les résultats ont été au-delà de mes attentes.",
        name: "Karim Benali",
        role: "Consultant marketing",
        badge: "120K€ de CA additionnel",
      },
    ],
    accentColor: "#C6FF00",
  },
  render: (props) => <TestimonialsEnhancedComponent {...props} />,
};
