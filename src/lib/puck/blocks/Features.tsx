"use client";

import type { ComponentConfig } from "@measured/puck";
import { ColorField } from "../fields/ColorField";
import { useInView, FadeIn } from "../animations";
import {
  GraduationCap,
  Video,
  MessageCircle,
  Users,
  Trophy,
  BarChart3,
  Target,
  LineChart,
  Flame,
  Zap,
  Shield,
  Rocket,
  Star,
  Heart,
  Clock,
  CheckCircle,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  GraduationCap,
  Video,
  MessageCircle,
  Users,
  Trophy,
  BarChart3,
  Target,
  LineChart,
  Flame,
  Zap,
  Shield,
  Rocket,
  Star,
  Heart,
  Clock,
  CheckCircle,
};

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface FeaturesProps {
  heading: string;
  subtitle: string;
  columns: string;
  features: Feature[];
  accentColor: string;
}

function FeatureIcon({
  name,
  accentColor,
}: {
  name: string;
  accentColor: string;
}) {
  const IconComponent = ICON_MAP[name];
  if (IconComponent) {
    return (
      <div
        className="mb-5 flex size-10 items-center justify-center rounded-lg transition-colors duration-300"
        style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
      >
        <IconComponent className="size-5" />
      </div>
    );
  }
  // Fallback: treat as emoji
  return <div className="text-3xl mb-4">{name}</div>;
}

function FeaturesComponent({
  heading,
  subtitle,
  columns,
  features,
  accentColor,
}: FeaturesProps) {
  const { ref, isInView } = useInView();

  return (
    <section ref={ref} className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
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
        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {features.map((feature, i) => (
            <div
              key={i}
              className="group rounded-2xl p-8 border border-white/10 bg-white/[0.03] transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:bg-white/[0.06]"
              style={{
                opacity: isInView ? 1 : 0,
                transform: isInView ? "translateY(0)" : "translateY(24px)",
                transition: "all 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
                transitionDelay: `${i * 80}ms`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${accentColor}40`;
                e.currentTarget.style.boxShadow = `0 0 30px ${accentColor}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div className="transition-transform duration-300 group-hover:scale-110">
                <FeatureIcon name={feature.icon} accentColor={accentColor} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export const Features: ComponentConfig<FeaturesProps> = {
  label: "Fonctionnalités",
  fields: {
    heading: { type: "text", label: "Titre" },
    subtitle: { type: "textarea", label: "Sous-titre" },
    columns: {
      type: "select",
      label: "Colonnes",
      options: [
        { label: "2 colonnes", value: "2" },
        { label: "3 colonnes", value: "3" },
        { label: "4 colonnes", value: "4" },
      ],
    },
    features: {
      type: "array",
      label: "Fonctionnalités",
      arrayFields: {
        icon: { type: "text", label: "Icône (nom Lucide ou emoji)" },
        title: { type: "text", label: "Titre" },
        description: { type: "textarea", label: "Description" },
      },
      getItemSummary: (item: Feature) => item.title || "Fonctionnalité",
      defaultItemProps: {
        icon: "Rocket",
        title: "Titre",
        description: "Description de la fonctionnalité.",
      },
    },
    accentColor: {
      label: "Couleur d'accent",
      ...ColorField,
    },
  },
  defaultProps: {
    heading: "Ce qui nous distingue",
    subtitle: "",
    columns: "3",
    features: [
      {
        icon: "Target",
        title: "Précision",
        description: "Une approche ciblée pour des résultats concrets.",
      },
      {
        icon: "Zap",
        title: "Rapidité",
        description: "Des résultats visibles en quelques semaines.",
      },
      {
        icon: "Trophy",
        title: "Excellence",
        description: "Un standard de qualité sans compromis.",
      },
    ],
    accentColor: "#C6FF00",
  },
  render: (props) => <FeaturesComponent {...props} />,
};
