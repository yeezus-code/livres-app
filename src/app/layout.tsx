import type { Metadata, Viewport } from "next";
import { Footer } from "@/components/Footer";
import { Header, StatusBanner } from "@/components/Header";
import { SITE } from "@/lib/site";
import { LibraryProvider } from "@/components/LibraryProvider";
// Polices intégrées au site (pas besoin de Google Fonts) : Fraunces pour les titres, Inter pour le texte
import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/wght-italic.css";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.description,
  applicationName: SITE.name,
  // Aperçu affiché quand on partage un lien (WhatsApp, iMessage, réseaux sociaux…)
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export const viewport: Viewport = {
  themeColor: "#0b2b29",
  viewportFit: "cover", // la barre du bas respecte la zone du geste « accueil » des iPhone
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body>
        <LibraryProvider>
          <Header />
          <main className="main">
            <StatusBanner />
            {children}
          </main>
          <Footer />
        </LibraryProvider>
      </body>
    </html>
  );
}
