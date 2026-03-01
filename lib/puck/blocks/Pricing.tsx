import type { ComponentConfig } from "@measured/puck";
import { ColorField } from "../fields/ColorField";

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  features: string;
  ctaText: string;
  ctaUrl: string;
  highlighted: boolean;
}

interface PricingProps {
  heading: string;
  subtitle: string;
  plans: PricingPlan[];
  accentColor: string;
}

export const Pricing: ComponentConfig<PricingProps> = {
  label: "Tarifs",
  fields: {
    heading: { type: "text", label: "Titre" },
    subtitle: { type: "textarea", label: "Sous-titre" },
    plans: {
      type: "array",
      label: "Plans",
      arrayFields: {
        name: { type: "text", label: "Nom du plan" },
        price: { type: "text", label: "Prix (ex: 49€)" },
        period: { type: "text", label: "Période (ex: /mois)" },
        features: { type: "textarea", label: "Avantages (un par ligne)" },
        ctaText: { type: "text", label: "Texte du bouton" },
        ctaUrl: { type: "text", label: "Lien du bouton" },
        highlighted: {
          type: "radio",
          label: "Mis en avant",
          options: [
            { label: "Oui", value: "true" },
            { label: "Non", value: "false" },
          ],
        },
      },
      getItemSummary: (item: PricingPlan) => item.name || "Plan",
      defaultItemProps: {
        name: "Standard",
        price: "49€",
        period: "/mois",
        features: "Accès complet\nSupport email\nCertificat",
        ctaText: "Choisir",
        ctaUrl: "#",
        highlighted: false,
      },
    },
    accentColor: {
      label: "Couleur d'accent",
      ...ColorField,
    },
  },
  defaultProps: {
    heading: "Nos tarifs",
    subtitle: "Choisissez l'offre qui vous correspond.",
    plans: [
      {
        name: "Essentiel",
        price: "29€",
        period: "/mois",
        features: "Accès aux formations\nSupport email\nCommunauté",
        ctaText: "Démarrer",
        ctaUrl: "#",
        highlighted: false,
      },
      {
        name: "Premium",
        price: "79€",
        period: "/mois",
        features: "Tout Essentiel\nSessions live\nMentorat\nCertificat",
        ctaText: "Choisir Premium",
        ctaUrl: "#",
        highlighted: true,
      },
    ],
    accentColor: "#C6FF00",
  },
  render: ({ heading, subtitle, plans, accentColor }) => (
    <section className="px-6 py-20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">{heading}</h2>
          {subtitle && <p className="text-lg text-gray-300">{subtitle}</p>}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {plans.map((plan, i) => {
            const isHighlighted = plan.highlighted === true || plan.highlighted === ("true" as unknown as boolean);
            return (
              <div
                key={i}
                className="rounded-2xl p-8 border"
                style={{
                  borderColor: isHighlighted ? accentColor : "rgba(255,255,255,0.1)",
                  background: isHighlighted ? `${accentColor}08` : "rgba(255,255,255,0.02)",
                  boxShadow: isHighlighted ? `0 0 40px ${accentColor}15` : "none",
                }}
              >
                {isHighlighted && (
                  <div
                    className="text-xs font-bold uppercase tracking-wider mb-4 px-3 py-1 rounded-full inline-block"
                    style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                  >
                    Populaire
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-display font-bold">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.split("\n").filter(Boolean).map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-gray-300">
                      <span style={{ color: accentColor }}>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.ctaUrl}
                  className="block w-full text-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02]"
                  style={
                    isHighlighted
                      ? { backgroundColor: accentColor, color: "#0D0D0D" }
                      : { border: "1px solid rgba(255,255,255,0.2)", color: "white" }
                  }
                >
                  {plan.ctaText}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  ),
};
