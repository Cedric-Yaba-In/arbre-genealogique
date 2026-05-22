import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/ui/Header";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Arbre Généalogique — Famille Bafang",
  description: "L'arbre généalogique de la famille, peuple de l'Ouest Cameroun",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${geist.className} bg-amber-50 min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
