import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/shared/nav";

export const metadata: Metadata = {
  title: "Max Planner - TGV Max Tracker",
  description: "Suivi des places TGV Max en temps réel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen">
        <Nav />
        <main className="max-w-6xl mx-auto px-3 md:px-4 py-3 md:py-4 pb-20 md:pb-4">
          {children}
        </main>
      </body>
    </html>
  );
}
