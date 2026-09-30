import type { Metadata, Viewport } from "next";
import { Header, StatusBanner } from "@/components/Header";
import { LibraryProvider } from "@/components/LibraryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Livres — mes lectures",
  description: "Notez et gardez une trace de vos lectures.",
};

export const viewport: Viewport = {
  themeColor: "#0f6b6b",
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
        </LibraryProvider>
      </body>
    </html>
  );
}
