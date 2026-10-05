"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/arc/button/button";
import { motionTokens } from "@/components/arc/motion-tokens";
import { Logo } from "@repo/ui/src/components/Brand";

/**
 * Terms, a web-only page (Arc + Motion), linked from 03 Mobile number. The shared app screens
 * cannot use Arc because it renders HTML.
 *
 * Prototype copy, not reviewed legal text. Replace before any public release.
 */
export const paragraphs = [
  "ParaTrack is a working prototype for Tarlac City. Fares, arrival times and seat counts are estimates and may be wrong.",
  "Your mobile number is used only to sign you in and to let a driver's cooperative reach you about a trip. We do not sell it.",
  "Your location stays on your device and is never sent to drivers or to our servers unless you share it as a driver on a route.",
  "Do not rely on ParaTrack for safety decisions. Follow traffic rules, and pay the fare posted inside the vehicle.",
];

export default function Terms() {
  const reduced = useReducedMotion() ?? false;
  return (
    <main className="mx-auto flex min-h-screen max-w-[560px] flex-col gap-5 px-6 py-8">
      <Logo height={36} />
      <motion.h1
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? motionTokens.duration.instant : motionTokens.duration.considered, ease: [...motionTokens.ease.enter] }}
        className="text-title-lg font-sans-medium"
      >
        Terms of Service
      </motion.h1>
      {paragraphs.map((p, i) => (
        <p key={i} className="text-body-md text-text-secondary">
          {p}
        </p>
      ))}
      <Link href="/login" className="self-start">
        <Button variant="secondary">Back to the app</Button>
      </Link>
    </main>
  );
}