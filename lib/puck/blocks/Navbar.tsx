"use client";

import { useState } from "react";
import type { ComponentConfig } from "@measured/puck";
import { ColorField } from "../fields/ColorField";
import { ImageUploadField } from "../fields/ImageUploadField";

interface NavLink {
  label: string;
  href: string;
}

interface NavbarProps {
  brandName: string;
  logoUrl: string;
  links: NavLink[];
  ctaText: string;
  ctaUrl: string;
  accentColor: string;
}

function NavbarComponent({
  brandName,
  logoUrl,
  links,
  ctaText,
  ctaUrl,
  accentColor,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0D0D0D]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Brand */}
        <a href="/" className="shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt={brandName} className="h-8 w-auto" />
          ) : (
            <span className="text-lg font-display font-bold text-white">
              {brandName}
            </span>
          )}
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-gray-300 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center">
          {ctaText && (
            <a
              href={ctaUrl}
              className="rounded-lg px-5 py-2 text-sm font-semibold transition-all hover:scale-105"
              style={{
                backgroundColor: accentColor,
                color: "#0D0D0D",
              }}
            >
              {ctaText}
            </a>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-300 hover:text-white md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Menu"
        >
          {mobileOpen ? (
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out md:hidden ${
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-1 border-t border-white/10 px-6 py-4">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block rounded-md px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          {ctaText && (
            <a
              href={ctaUrl}
              className="mt-2 block rounded-lg px-3 py-2 text-center text-sm font-semibold transition-colors"
              style={{
                backgroundColor: accentColor,
                color: "#0D0D0D",
              }}
              onClick={() => setMobileOpen(false)}
            >
              {ctaText}
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}

export const Navbar: ComponentConfig<NavbarProps> = {
  label: "Barre de navigation",
  fields: {
    brandName: { type: "text", label: "Nom de la marque" },
    logoUrl: {
      label: "Logo (URL ou upload)",
      ...ImageUploadField,
    },
    links: {
      type: "array",
      label: "Liens",
      arrayFields: {
        label: { type: "text", label: "Texte" },
        href: { type: "text", label: "Lien (ex: #section)" },
      },
      getItemSummary: (item: NavLink) => item.label || "Lien",
      defaultItemProps: {
        label: "Lien",
        href: "#",
      },
    },
    ctaText: { type: "text", label: "Texte du bouton CTA" },
    ctaUrl: { type: "text", label: "Lien du bouton CTA" },
    accentColor: {
      label: "Couleur d'accent",
      ...ColorField,
    },
  },
  defaultProps: {
    brandName: "Upscale",
    logoUrl: "",
    links: [
      { label: "Programme", href: "#programme" },
      { label: "Méthode", href: "#methode" },
      { label: "Témoignages", href: "#temoignages" },
      { label: "Tarif", href: "#tarif" },
    ],
    ctaText: "Réserver un appel",
    ctaUrl: "#booking",
    accentColor: "#C6FF00",
  },
  render: (props) => <NavbarComponent {...props} />,
};
