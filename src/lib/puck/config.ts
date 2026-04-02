import type { Config } from "@measured/puck";

import { Hero } from "./blocks/Hero";
import { Features } from "./blocks/Features";
import { Testimonials } from "./blocks/Testimonials";
import { CTA } from "./blocks/CTA";
import { FAQ } from "./blocks/FAQ";
import { TextImage } from "./blocks/TextImage";
import { VideoEmbed } from "./blocks/VideoEmbed";
import { Pricing } from "./blocks/Pricing";
import { Spacer } from "./blocks/Spacer";
import { EmailCapture } from "./blocks/EmailCapture";
import { RichText } from "./blocks/RichText";
import { HeroScaling } from "./blocks/HeroScaling";
import { HowItWorks } from "./blocks/HowItWorks";
import { Navbar } from "./blocks/Navbar";
import { Footer } from "./blocks/Footer";
import { CtaBanner } from "./blocks/CtaBanner";
import { TestimonialsEnhanced } from "./blocks/TestimonialsEnhanced";
import { PricingSingle } from "./blocks/PricingSingle";

export const puckConfig: Config = {
  categories: {
    "Sections principales": {
      components: [
        "Hero",
        "HeroScaling",
        "CTA",
        "TextImage",
        "Features",
        "HowItWorks",
        "Pricing",
        "PricingSingle",
      ],
    },
    Contenu: {
      components: [
        "RichText",
        "VideoEmbed",
        "FAQ",
        "Testimonials",
        "TestimonialsEnhanced",
      ],
    },
    Conversion: {
      components: ["EmailCapture", "CtaBanner"],
    },
    Navigation: {
      components: ["Navbar", "Footer"],
    },
    "Mise en page": {
      components: ["Spacer"],
    },
  },
  components: {
    Hero,
    HeroScaling,
    Features,
    Testimonials,
    TestimonialsEnhanced,
    CTA,
    CtaBanner,
    FAQ,
    TextImage,
    VideoEmbed,
    Pricing,
    PricingSingle,
    HowItWorks,
    Navbar,
    Footer,
    Spacer,
    EmailCapture,
    RichText,
  },
};
