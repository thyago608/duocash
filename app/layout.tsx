import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { PaletteEffect } from "@/components/palette-effect";
import { PALETTE_BLOCKING_SCRIPT } from "@/lib/palette-constants";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DuoCash — Planejamento financeiro",
  description: "Planejamento financeiro compartilhado de Thyago e Thayla",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: PALETTE_BLOCKING_SCRIPT }} />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <PaletteEffect />
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
