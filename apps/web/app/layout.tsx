import "./globals.css";
// After Tailwind, so Arc's tokens win over preflight on equal specificity.
import "@/components/arc/foundation.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-background font-sans text-foreground">{children}</body>
    </html>
  );
}
