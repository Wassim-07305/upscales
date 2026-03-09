"use client";

import { useState } from "react";
import type { ComponentConfig } from "@measured/puck";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  heading: string;
  items: FAQItem[];
}

function FAQAccordion({ heading, items }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-14">{heading}</h2>
        <div className="space-y-3">
          {items.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left font-medium hover:bg-white/[0.03] transition-colors"
                >
                  <span>{item.question}</span>
                  <span className="text-xl ml-4 flex-shrink-0 transition-transform duration-200" style={{ transform: isOpen ? "rotate(45deg)" : "none" }}>
                    +
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-gray-400 leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export const FAQ: ComponentConfig<FAQProps> = {
  label: "FAQ",
  fields: {
    heading: { type: "text", label: "Titre" },
    items: {
      type: "array",
      label: "Questions",
      arrayFields: {
        question: { type: "text", label: "Question" },
        answer: { type: "textarea", label: "Réponse" },
      },
      getItemSummary: (item: FAQItem) => item.question || "Question",
      defaultItemProps: {
        question: "Question fréquente ?",
        answer: "Réponse détaillée à la question.",
      },
    },
  },
  defaultProps: {
    heading: "Questions fréquentes",
    items: [
      { question: "Comment ça fonctionne ?", answer: "Inscrivez-vous, accédez aux contenus et progressez à votre rythme." },
      { question: "Y a-t-il un engagement ?", answer: "Non, vous pouvez annuler à tout moment sans frais." },
      { question: "Puis-je obtenir un certificat ?", answer: "Oui, un certificat est délivré à la fin de chaque formation." },
    ],
  },
  render: (props) => <FAQAccordion {...props} />,
};
