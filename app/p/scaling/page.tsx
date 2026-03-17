import type { Metadata } from "next";
import type { Data } from "@measured/puck";
import { ScalingPageClient } from "./client";

export const metadata: Metadata = {
  title: "Programme Scaling 6 Mois — Upscale",
  description:
    "On t'accompagne pour scale ton business en 6 mois, paiement au résultat.",
};

const puckData: Data = {
  root: { props: {} },
  content: [
    {
      type: "Navbar",
      props: {
        id: "navbar-1",
        brandName: "Upscale",
        logoUrl: "",
        links: [
          { label: "Programme", href: "#programme" },
          { label: "Méthode", href: "#methode" },
          { label: "Témoignages", href: "#temoignages" },
          { label: "Tarif", href: "#tarif" },
          { label: "FAQ", href: "#faq" },
        ],
        ctaText: "Réserver un appel",
        ctaUrl: "#booking",
        accentColor: "#C6FF00",
      },
    },
    {
      type: "HeroScaling",
      props: {
        id: "hero-scaling-1",
        headline:
          "Passe de freelance solo à une agence de 10+ personnes en 6 mois",
        subtitle:
          "Un accompagnement personnalisé pour scaler ton activité. Tu paies uniquement en fonction des revenus que tu génères.",
        ctaText: "Réserver mon appel stratégique",
        ctaUrl: "#booking",
        secondaryCtaText: "Voir les résultats",
        secondaryCtaUrl: "#temoignages",
        badges: [
          { text: "+200 freelances accompagnés" },
          { text: "Paiement au résultat" },
          { text: "6 mois d'accompagnement" },
        ],
        stats: [
          { value: "10x", label: "Croissance moyenne" },
          { value: "87%", label: "Taux de rétention" },
          { value: "6 mois", label: "Durée du programme" },
        ],
        accentColor: "#C6FF00",
      },
    },
    {
      type: "Features",
      props: {
        id: "features-piliers",
        heading: "Pourquoi c'est différent",
        subtitle: "Les 6 piliers de notre programme de scaling.",
        columns: "3",
        features: [
          {
            icon: "💰",
            title: "Paiement au résultat",
            description:
              "Tu paies uniquement en fonction des revenus générés. Zéro risque pour toi. Notre succès dépend du tien.",
          },
          {
            icon: "🎯",
            title: "Accompagnement 1-to-1",
            description:
              "Un coach dédié qui te connaît, connaît ton business et te dit exactement quoi faire et par où commencer.",
          },
          {
            icon: "📋",
            title: "Plan d'action quotidien",
            description:
              "Chaque jour, un appel pour te donner ton prochain plan d'action concret. Pas de théorie, que de l'exécution.",
          },
          {
            icon: "🎬",
            title: "Scaling personnalisé via Loom",
            description:
              "Des audits vidéo personnalisés de ton business avec des recommandations concrètes adaptées à ta situation.",
          },
          {
            icon: "📊",
            title: "Data-driven",
            description:
              "Tracker tes résultats en temps réel. Chaque décision est basée sur tes données, pas sur des suppositions.",
          },
          {
            icon: "👥",
            title: "Communauté active",
            description:
              "Rejoins une communauté de freelances ambitieux. Appels de groupe, messagerie vocale, entraide permanente.",
          },
        ],
        accentColor: "#C6FF00",
      },
    },
    {
      type: "HowItWorks",
      props: {
        id: "how-it-works-1",
        heading: "Comment ça marche",
        subtitle:
          "Un processus simple en 4 étapes pour transformer ton activité.",
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
    },
    {
      type: "Features",
      props: {
        id: "features-obtiens",
        heading: "Ce que tu obtiens",
        subtitle: "Tout est inclus dans le programme.",
        columns: "3",
        features: [
          {
            icon: "📞",
            title: "Appel stratégique hebdo",
            description:
              "1 appel stratégique par semaine en one-to-one avec ton coach dédié.",
          },
          {
            icon: "👥",
            title: "Appels de groupe",
            description:
              "Appels de groupe hebdomadaires avec la communauté pour partager et progresser.",
          },
          {
            icon: "📋",
            title: "Plan d'action quotidien",
            description:
              "Un plan d'action personnalisé chaque jour pour avancer concrètement.",
          },
          {
            icon: "🎬",
            title: "Looms d'audit",
            description:
              "Des audits vidéo personnalisés de ton business avec des recommandations concrètes.",
          },
          {
            icon: "🎙️",
            title: "Messagerie vocale illimitée",
            description:
              "Accès illimité à la messagerie vocale avec ton coach pour ne jamais rester bloqué.",
          },
          {
            icon: "📊",
            title: "Dashboard & tracking",
            description:
              "Tracker de résultats et dashboard data pour suivre ta progression en temps réel.",
          },
          {
            icon: "🏠",
            title: "Communauté privée",
            description:
              "Accès à la communauté privée de freelances ambitieux.",
          },
          {
            icon: "📚",
            title: "Formation délégation",
            description:
              "Formation complète sur la délégation et le management d'équipe.",
          },
          {
            icon: "🗓️",
            title: "6 mois complets",
            description:
              "Un accompagnement intensif sur 6 mois pour des résultats durables.",
          },
        ],
        accentColor: "#C6FF00",
      },
    },
    {
      type: "TestimonialsEnhanced",
      props: {
        id: "testimonials-1",
        heading: "Ils ont scalé avec nous",
        subtitle: "Des résultats concrets pour des freelances ambitieux.",
        testimonials: [
          {
            quote:
              "En 4 mois, je suis passé de freelance solo à une agence de 5 personnes. Le plan d'action quotidien a tout changé. J'avais enfin une direction claire chaque jour.",
            name: "Thomas Durand",
            role: "Fondateur, agence web",
            badge: "CA x3 en 4 mois",
          },
          {
            quote:
              "Le coaching one-to-one m'a permis de structurer mon offre et de déléguer. Je gère maintenant une équipe de 8 personnes et j'ai retrouvé du temps pour moi.",
            name: "Sarah Lefèvre",
            role: "Directrice, studio design",
            badge: "+8 collaborateurs",
          },
          {
            quote:
              "Le modèle de paiement au résultat m'a convaincu. Zéro risque, et les résultats ont été au-delà de mes attentes. J'ai doublé mon CA en 5 mois.",
            name: "Karim Benali",
            role: "Consultant marketing digital",
            badge: "120K€ de CA additionnel",
          },
        ],
        accentColor: "#C6FF00",
      },
    },
    {
      type: "PricingSingle",
      props: {
        id: "pricing-single-1",
        heading: "Investissement",
        subtitle: "",
        planName: "Programme Scaling 6 Mois",
        priceText: "Basé sur tes résultats",
        tagline:
          "Tu ne paies qu'en fonction des revenus que tu génères. Si tu ne gagnes rien, tu ne paies rien.",
        features:
          "1 appel stratégique par semaine en one-to-one\nAppels de groupe hebdomadaires avec la communauté\nPlan d'action quotidien personnalisé\nLooms d'audit personnalisés de ton business\nMessagerie vocale illimitée avec ton coach\nTracker de résultats et dashboard data\nAccès à la communauté privée\nFormation complète sur la délégation et le management\nAccompagnement sur 6 mois complet",
        ctaText: "Réserver mon appel stratégique",
        ctaUrl: "#booking",
        accentColor: "#C6FF00",
      },
    },
    {
      type: "FAQ",
      props: {
        id: "faq-1",
        heading: "Questions fréquentes",
        items: [
          {
            question: "C'est un scam ?",
            answer:
              "Notre modèle de paiement au résultat prouve notre engagement. Si tu ne gagnes pas, on ne gagne pas. On a accompagné +200 freelances avec un taux de rétention de 87%.",
          },
          {
            question: "Je n'ai pas le temps",
            answer:
              "1 appel par semaine + un plan d'action quotidien clair. On optimise ton temps, pas on l'alourdit.",
          },
          {
            question: "Ça va marcher pour mon activité ?",
            answer:
              "Chaque accompagnement est 100% personnalisé. Looms dédiés, plan d'action adapté, coaching one-to-one.",
          },
          {
            question: "Comment fonctionne le paiement au résultat ?",
            answer:
              "On définit ensemble tes objectifs de revenus. Tu paies un pourcentage uniquement sur les revenus additionnels générés grâce au programme.",
          },
          {
            question: "Je suis déjà en agence, c'est pour moi ?",
            answer:
              "Que tu sois freelance solo ou déjà en petite équipe, on adapte le programme à ton niveau pour atteindre le palier suivant.",
          },
          {
            question: "C'est quoi la communauté ?",
            answer:
              "Un espace décentralisé avec des freelances comme toi. Appels de groupe, messagerie vocale, partage de wins et d'expérience.",
          },
        ],
      },
    },
    {
      type: "CtaBanner",
      props: {
        id: "cta-banner-1",
        heading: "Prêt à scaler ?",
        subtitle:
          "Réserve ton appel stratégique gratuit et découvre ton plan de scaling personnalisé.",
        ctaText: "Réserver mon appel stratégique",
        ctaUrl: "#booking",
        note: "Places limitées — On n'accepte que 10 nouveaux clients par mois",
        accentColor: "#C6FF00",
      },
    },
    {
      type: "Footer",
      props: {
        id: "footer-1",
        brandName: "Upscale",
        description:
          "L'accompagnement au scaling pour freelances et agences ambitieux.",
        columns: [
          {
            title: "Programme",
            links:
              "Comment ça marche|#methode\nTémoignages|#temoignages\nTarif|#tarif\nFAQ|#faq",
          },
          {
            title: "Légal",
            links:
              "Mentions légales|/mentions-legales\nCGV|/cgv\nPolitique de confidentialité|/confidentialite",
          },
        ],
        copyright: "© 2025 Upscale. Tous droits réservés.",
        accentColor: "#C6FF00",
      },
    },
  ],
};

export default function ScalingLandingPage() {
  return <ScalingPageClient data={puckData} />;
}
