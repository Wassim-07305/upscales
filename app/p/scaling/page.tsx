import type { Metadata } from "next";
import ScalingPageClient from "./client";

export const metadata: Metadata = {
  title: "Atteins 10K€/mois en freelance — Upscale",
  description:
    "Formation, coaching personnalisé, communauté et outils business réunis dans un seul espace. L'accompagnement complet pour structurer et scaler ton activité.",
};

export default function ScalingLandingPage() {
  return <ScalingPageClient />;
}
