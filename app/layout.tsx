import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Vioscribe",
  description: "Study decks, notes, and a daily streak.",
  icons: { icon: "/vioscribe-flame.png", apple: "/vioscribe-flame.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
