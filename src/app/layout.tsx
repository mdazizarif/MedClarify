import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "MedClarify — Vernacular Prescription & Lab Report Translator",
  description:
    "Understand medical prescriptions and blood test reports in plain language (English & Hindi) with audio read-aloud and dosage schedules.",
  keywords: [
    "medical translator",
    "prescription reader",
    "lab report explainer",
    "Hindi medical",
    "healthcare AI",
    "Gemini AI",
  ],
  openGraph: {
    title: "MedClarify — Medical Translation for Patients",
    description: "Understand your prescriptions and lab reports in plain language.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${playfair.variable} dark`}>
      <body className="font-sans antialiased bg-[var(--bg-page)] text-[var(--text-main)] min-h-screen selection:bg-emerald-500/30 selection:text-emerald-900 dark:selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}
