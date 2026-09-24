import type { Metadata } from "next";
import { Outfit, JetBrains_Mono, Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Providers from "@/providers/providers";

const fontSans = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontInter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fontSerif = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ultron AI Workbench",
  description: "Sovereign AI Workbench for Confidential Industrial Knowledge Work",
};

import { ParticleCursor } from "@/components/ui/particle-cursor";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable} ${fontInter.variable} ${fontSerif.variable} h-full antialiased font-sans`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <ParticleCursor />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
