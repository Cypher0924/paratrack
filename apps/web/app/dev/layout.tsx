import { notFound } from "next/navigation";
import type { ReactNode } from "react";

// The component galleries are for development and CI screenshots, not the live site.
export default function DevLayout({ children }: { children: ReactNode }) {
  if (process.env.VERCEL_ENV === "production") notFound();
  return children;
}
