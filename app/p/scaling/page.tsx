import type { Metadata } from "next";
import ScalingPageClient from "./client";

export const metadata: Metadata = {
  title: "Tu fais 5K€/mois. On t'emmène à 20K. — Upscale",
  description:
    "6 mois d'accompagnement one-to-one avec un coach dédié. Payé au résultat — si tu ne gagnes pas plus, tu ne paies pas plus.",
};

export default function ScalingLandingPage() {
  return <ScalingPageClient />;
}
