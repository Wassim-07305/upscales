import type { Metadata } from "next";
import ScalingPageClient from "./client";

export const metadata: Metadata = {
  title: "Atteins 5K, 10K voire 20K€/mois — Upscale",
  description:
    "La roadmap pas-à-pas pour structurer ton business et scaler de façon simple, régulière et prévisible. Déjà utilisé par 200+ coachs rentables.",
};

export default function ScalingLandingPage() {
  return <ScalingPageClient />;
}
