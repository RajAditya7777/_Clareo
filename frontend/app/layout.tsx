import type { Metadata } from "next";
import "./globals.css";
import LenisWrapper from "@/components/LenisWrapper";
import { AuthProvider } from "@/components/AuthProvider";

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
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#000" }}>
        <AuthProvider>
          <LenisWrapper>
            {children}
          </LenisWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
