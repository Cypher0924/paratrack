import "./globals.css";
// After Tailwind, so Arc's tokens win over preflight on equal specificity.
import "@/components/arc/foundation.css";
import { Geist_Mono, Geist, Inter } from "next/font/google";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

// Screen headings and the welcome headline (Figma Display/LG, Title/LG).
const geist = Geist({
  subsets: ["latin"],
  weight: "500",
  variable: "--font-geist",
  display: "swap",
});

// Plate numbers (Figma Mono/MD)
const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: "500",
  variable: "--font-geist-mono",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${geist.variable} ${geistMono.variable}`}>
      <body className="bg-background font-sans text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
