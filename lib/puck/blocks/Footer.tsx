import type { ComponentConfig } from "@measured/puck";
import { ColorField } from "../fields/ColorField";

interface FooterColumn {
  title: string;
  links: string;
}

interface FooterProps {
  brandName: string;
  description: string;
  columns: FooterColumn[];
  copyright: string;
  accentColor: string;
}

function parseLinks(raw: string): { label: string; href: string }[] {
  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|");
      const label = parts[0]?.trim() || "";
      const href = parts[1]?.trim() || "#";
      return { label, href };
    });
}

export const Footer: ComponentConfig<FooterProps> = {
  label: "Footer",
  fields: {
    brandName: { type: "text", label: "Nom de la marque" },
    description: { type: "textarea", label: "Description" },
    columns: {
      type: "array",
      label: "Colonnes de liens",
      arrayFields: {
        title: { type: "text", label: "Titre de la colonne" },
        links: {
          type: "textarea",
          label: "Liens (format : label|url, un par ligne)",
        },
      },
      getItemSummary: (item: FooterColumn) => item.title || "Colonne",
      defaultItemProps: {
        title: "Colonne",
        links: "Lien 1|#\nLien 2|#",
      },
    },
    copyright: { type: "text", label: "Copyright" },
    accentColor: {
      label: "Couleur d'accent",
      ...ColorField,
    },
  },
  defaultProps: {
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
    copyright: `© ${new Date().getFullYear()} Upscale. Tous droits réservés.`,
    accentColor: "#C6FF00",
  },
  render: ({ brandName, description, columns, copyright, accentColor }) => (
    <footer className="w-full border-t border-white/10 bg-[#0D0D0D] px-6 pt-16 pb-8">
      <div className="mx-auto max-w-7xl">
        {/* Top section */}
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          {/* Brand */}
          <div className="max-w-xs shrink-0">
            <span
              className="text-xl font-display font-bold"
              style={{ color: accentColor }}
            >
              {brandName}
            </span>
            {description && (
              <p className="mt-3 text-sm text-gray-400">{description}</p>
            )}
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((column, i) => {
              const links = parseLinks(column.links);
              return (
                <div key={i}>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
                    {column.title}
                  </h3>
                  <ul className="mt-4 space-y-2">
                    {links.map((link, j) => (
                      <li key={j}>
                        <a
                          href={link.href}
                          className="text-sm text-gray-400 transition-colors hover:text-white"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 border-t border-white/10 pt-6">
          <p className="text-center text-sm text-gray-500">{copyright}</p>
        </div>
      </div>
    </footer>
  ),
};
