import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PopupBanner } from "@/components/shared/PopupBanner";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Ithaca Family Academy",
  description:
    "Empowering youth to explore the future and build the skills to thrive in the AI era.",
  keywords: [
    "Ithaca Family Academy",
    "youth education",
    "AI",
    "engineering",
    "PBL",
    "project-based learning",
  ],
  openGraph: {
    title: "Ithaca Family Academy",
    description:
      "Empowering youth to explore the future and build the skills to thrive in the AI era.",
    url: "https://ithacateens.com",
    siteName: "Ithaca Family Academy",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <PopupBanner />
      </body>
    </html>
  );
}
