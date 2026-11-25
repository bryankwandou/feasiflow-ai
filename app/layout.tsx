import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./tema.css";
import { PenyorotKartu } from "@/components/Gerak";
import { PenyediaBahasa } from "@/lib/i18n/PenyediaBahasa";
import KendaliTampilan from "@/components/KendaliTampilan";
import { SKRIP_TEMA_AWAL } from "@/lib/tema/skrip-awal";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FeasiFlow AI: Kelayakan Ide Fintech Lending",
  description:
    "Tiga agen AI menilai kelayakan ide fintech lending (LPBBTI) dengan Business Model Canvas, riset pasar, dan data resmi OJK. Setiap skor disertai sumbernya.",
  openGraph: {
    title: "FeasiFlow AI",
    description: "Sistem agentic AI untuk klasifikasi kelayakan ide startup fintech lending",
    url: "https://feasiflowai.vercel.app",
    siteName: "FeasiFlow AI",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SKRIP_TEMA_AWAL }} />
      </head>
      <body className="bg-base text-fg antialiased">
        <PenyediaBahasa>
          <PenyorotKartu />
          <KendaliTampilan />
          {children}
        </PenyediaBahasa>
      </body>
    </html>
  );
}
