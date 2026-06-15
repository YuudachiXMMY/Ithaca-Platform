import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PopupBanner } from "@/components/shared/PopupBanner";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-675W5PPJEJ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-675W5PPJEJ');
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <Header />
        <main id="main-content" className="flex-1">{children}</main>
        <Footer />
        <PopupBanner />
      </body>
    </html>
  );
}
