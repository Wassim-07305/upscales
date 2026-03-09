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

export const puckConfig: Config = {
  categories: {
    "Sections principales": {
      components: ["Hero", "CTA", "TextImage", "Features", "Pricing"],
    },
    "Contenu": {
      components: ["RichText", "VideoEmbed", "FAQ", "Testimonials"],
    },
    "Conversion": {
      components: ["EmailCapture"],
    },
    "Mise en page": {
      components: ["Spacer"],
    },
  },
  components: {
    Hero,
    Features,
    Testimonials,
    CTA,
    FAQ,
    TextImage,
    VideoEmbed,
    Pricing,
    Spacer,
    EmailCapture,
    RichText,
  },
};
