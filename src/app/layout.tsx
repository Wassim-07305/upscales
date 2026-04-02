import type { Metadata, Viewport } from "next";
import { Outfit, Syne, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers/providers";
import { AnalyticsProvider } from "@/components/providers/analytics-provider";
import { getServerAuth } from "@/lib/supabase/server-auth";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://upscale-app.vercel.app",
  ),
  title: {
    default: "UPSCALE — Plateforme de Formation",
    template: "%s | UPSCALE",
  },
  description:
    "Plateforme de formation en ligne pour developper vos competences en vente, closing et business. Cours, coaching, communaute et outils.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "UPSCALE — Plateforme de Formation",
    description:
      "Plateforme de formation en ligne pour developper vos competences en vente, closing et business. Cours, coaching, communaute et outils.",
    siteName: "UPSCALE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UPSCALE — Plateforme de Formation",
    description:
      "Plateforme de formation en ligne pour developper vos competences en vente, closing et business. Cours, coaching, communaute et outils.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "UPSCALE",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D0D0D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getServerAuth();

  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${geistMono.variable} ${syne.variable} dark font-sans antialiased`}
      >
        <Providers initialUser={user} initialProfile={profile}>
          {children}
        </Providers>
        <AnalyticsProvider />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: "12px",
              fontSize: "14px",
              fontFamily: "Outfit, system-ui, sans-serif",
              boxShadow:
                "0 4px 16px rgba(0,0,0,0.08), 0 12px 40px rgba(0,0,0,0.04)",
            },
          }}
        />
      </body>
    </html>
  );
}
