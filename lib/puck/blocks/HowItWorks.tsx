"use client";

import type { ComponentConfig } from "@measured/puck";
import { ColorField } from "../fields/ColorField";
import { useInView, FadeIn } from "../animations";
import { getContrastColor } from "../utils";

interface Step {
  title: string;
  description: string;
}

interface HowItWorksProps {
  heading: string;
  subtitle: string;
  steps: Step[];
  accentColor: string;
}

function HowItWorksComponent({ heading, subtitle, steps, accentColor }: HowItWorksProps) {
  const { ref, isInView } = useInView();

  return (
    <section ref={ref} className="px-6 py-20">
      <div className="max-w-3xl mx-auto">
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

        {/* Steps */}
        <div className="relative">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            const number = String(index + 1).padStart(2, "0");

            return (
              <div
                key={index}
                className="relative flex gap-6 pb-12 last:pb-0 transition-all duration-700"
                style={{
                  opacity: isInView ? 1 : 0,
                  transform: isInView ? "translateY(0)" : "translateY(24px)",
                  transitionDelay: `${index * 150}ms`,
                }}
              >
                {/* Left column: number + connecting line */}
                <div className="relative flex flex-col items-center">
                  <div
                    className="z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold transition-transform duration-500"
                    style={{
                      backgroundColor: accentColor,
                      color: getContrastColor(accentColor),
                      transform: isInView ? "scale(1)" : "scale(0)",
                      transitionDelay: `${index * 150 + 100}ms`,
                    }}
                  >
                    {number}
                  </div>
                  {!isLast && (
                    <div
                      className="absolute top-12 bottom-0 w-px transition-all duration-1000"
                      style={{
                        backgroundColor: `${accentColor}30`,
                        opacity: isInView ? 1 : 0,
                        transitionDelay: `${index * 150 + 200}ms`,
                      }}
                    />
                  )}
                </div>

                {/* Right column: content */}
                <div className="pt-2 pb-2">
                  <h3 className="text-lg font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-400">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export const HowItWorks: ComponentConfig<HowItWorksProps> = {
  label: "Comment ça marche",
  fields: {
    heading: { type: "text", label: "Titre" },
    subtitle: { type: "textarea", label: "Sous-titre" },
    steps: {
      type: "array",
      label: "Étapes",
      arrayFields: {
        title: { type: "text", label: "Titre" },
        description: { type: "textarea", label: "Description" },
      },
      getItemSummary: (item: Step) => item.title || "Étape",
      defaultItemProps: {
        title: "Étape",
        description: "Description de l'étape.",
      },
    },
    accentColor: {
      label: "Couleur d'accent",
      ...ColorField,
    },
  },
  defaultProps: {
    heading: "Comment ça marche",
    subtitle: "Un processus simple en 4 étapes pour transformer ton activité.",
    steps: [
      {
        title: "Appel stratégique",
        description:
          "On analyse ta situation actuelle et on définit ensemble ta roadmap de scaling sur 6 mois.",
      },
      {
        title: "Plan d'action personnalisé",
        description:
          "Tu reçois ton plan d'action quotidien. On te dit quoi faire, par où commencer, étape par étape.",
      },
      {
        title: "Exécution accompagnée",
        description:
          "1 appel par semaine en one-to-one, appels de groupe, Looms personnalisés, messagerie vocale illimitée.",
      },
      {
        title: "Scaling & délégation",
        description:
          "Tu apprends à développer ton activité, déléguer tes tâches et construire une équipe de 10+ personnes.",
      },
    ],
    accentColor: "#C6FF00",
  },
  render: (props) => <HowItWorksComponent {...props} />,
};
