"use client";

import { useState } from "react";
import type { ComponentConfig } from "@measured/puck";
import { ColorField } from "../fields/ColorField";

interface EmailCaptureProps {
  heading: string;
  text: string;
  buttonText: string;
  successMessage: string;
  accentColor: string;
}

function EmailCaptureForm({ heading, text, buttonText, successMessage, accentColor }: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    // MVP: just show success — real integration later
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <section className="px-6 py-20">
        <div className="max-w-xl mx-auto text-center">
          <div className="text-4xl mb-4">✉️</div>
          <p className="text-xl font-semibold" style={{ color: accentColor }}>{successMessage}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-20">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-3xl font-display font-bold mb-4">{heading}</h2>
        {text && <p className="text-gray-300 mb-8">{text}</p>}
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            required
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": accentColor } as React.CSSProperties}
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex-shrink-0"
            style={{ backgroundColor: accentColor, color: "#0D0D0D" }}
          >
            {buttonText}
          </button>
        </form>
      </div>
    </section>
  );
}

export const EmailCapture: ComponentConfig<EmailCaptureProps> = {
  label: "Capture d'email",
  fields: {
    heading: { type: "text", label: "Titre" },
    text: { type: "textarea", label: "Texte" },
    buttonText: { type: "text", label: "Texte du bouton" },
    successMessage: { type: "text", label: "Message de succès" },
    accentColor: {
      label: "Couleur d'accent",
      ...ColorField,
    },
  },
  defaultProps: {
    heading: "Restez informé",
    text: "Inscrivez-vous pour recevoir nos dernières actualités et offres exclusives.",
    buttonText: "S'inscrire",
    successMessage: "Merci ! Vous êtes inscrit.",
    accentColor: "#C6FF00",
  },
  render: (props) => <EmailCaptureForm {...props} />,
};
