import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header, StatusBanner } from "@/components/Header";
import { InstallPrompt } from "@/components/InstallPrompt";
import { LibraryProvider } from "@/components/LibraryProvider";
import { isLocale, LOCALES, localizePath } from "@/i18n/config";
import { DICTIONARIES } from "@/i18n/dictionaries";
import { I18nProvider } from "@/i18n/I18nProvider";
import { SITE } from "@/lib/site";
// Polices intégrées au site (pas besoin de Google Fonts) : Fraunces pour les titres, Inter pour le texte
import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/wght-italic.css";
import "@fontsource-variable/inter";
import "../globals.css";

// Une version de chaque page par langue, construite à l'avance ; toute autre langue → 404
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = DICTIONARIES[lang].meta;
  const title = `${SITE.name} — ${t.tagline}`;
  return {
    metadataBase: new URL(SITE.url),
    title,
    description: t.description,
    applicationName: SITE.name,
    // Une fois installé sur iPhone : nom sous l'icône, barre d'état fondue dans l'en-tête
    appleWebApp: { capable: true, title: SITE.name, statusBarStyle: "black-translucent" },
    // Les versions de l'accueil dans les autres langues (pour Google)
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [l, localizePath(l, "/")])),
    },
    // Aperçu affiché quand on partage un lien (WhatsApp, iMessage, réseaux sociaux…)
    openGraph: {
      type: "website",
      locale: t.ogLocale,
      siteName: SITE.name,
      title,
      description: t.description,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: SITE.name }],
    },
    twitter: { card: "summary_large_image", images: ["/og.png"] },
  };
}

export const viewport: Viewport = {
  themeColor: "#0b2b29",
  viewportFit: "cover", // la barre du bas respecte la zone du geste « accueil » des iPhone
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={lang}>
      <body>
        <I18nProvider locale={lang} dictionary={DICTIONARIES[lang]}>
          <LibraryProvider>
            <Header />
            <main className="main">
              <StatusBanner />
              {children}
            </main>
            <Footer />
            <InstallPrompt />
          </LibraryProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
