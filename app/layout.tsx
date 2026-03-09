import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Autocompta | Comptabilité Automatisée",
  description: "Automatisez votre comptabilité avec l'IA. Classification PCM automatique, extraction intelligente des factures, conforme aux normes marocaines.",
  keywords: "comptabilité, automatisation, Maroc, PCM, factures, IA",
  authors: [{ name: "Autocompta" }],
  openGraph: {
    title: "Autocompta | Comptabilité Automatisée",
    description: "Automatisez votre comptabilité avec l'IA. Classification PCM automatique.",
    locale: "fr_MA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
