import type { Metadata } from "next";
import { Inter, Lora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import LenisWrapper from "@/components/LenisWrapper";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Claero — AI Talent Intelligence",
  description: "Claero helps recruiters analyze candidates with precision. Our AI radar maps skills, experience, seniority, match quality, gaps, and risk in real-time.",
  keywords: ["AI recruiting", "talent intelligence", "hiring platform", "candidate analysis", "HR tech"],
  openGraph: {
    title: "Claero — AI Talent Intelligence",
    description: "Precision talent radar for modern recruiters.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable} ${jetbrainsMono.variable}`}>
      <body style={{ margin: 0, padding: 0, background: "#000", fontFamily: "var(--font-inter, system-ui, sans-serif)" }}>
        <AuthProvider>
          <LenisWrapper>
            {children}
          </LenisWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}

