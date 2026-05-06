import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Ecotron AI | Ultimate AI Prompt Library & Generator",
  description: "Explore thousands of elite AI prompts for Seedance 2.0, Nano Banana, and more. Master generative AI with our content-first prompt engine.",
  keywords: ["AI Prompts", "Seedance 2.0", "Nano Banana", "AI Video Generation", "Prompt Engineering"],
  openGraph: {
    title: "Ecotron AI | Ultimate AI Prompt Library",
    description: "Master generative AI with elite prompts for video and image generation.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ecotron AI | Ultimate AI Prompt Library",
    description: "Master generative AI with elite prompts.",
  }
};

import Sidebar from "./components/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Sidebar />
        {children}
      </body>
    </html>
  );
}
