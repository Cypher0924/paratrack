"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/arc/button/button";
import { motionTokens } from "@/components/arc/motion-tokens";
import { Logo } from "@repo/ui/src/components/Brand";

/**
 * Privacy, a web-only page (Arc + Motion), linked from 03 Mobile number.
 *
 * Prototype copy, not reviewed legal text. Replace before any public release.
 */
const rows: [string, string][] = [
  ["Mobile number", "Used to sign you in with a one-time code. Test numbers only, in this prototype."],
  ["Your location", "Kept on your device. Sent to our servers only when you are a verified driver sharing your route."],
  ["Trip history", "Stored so you can see the trips you took. Linked to your account, not to your location trail."],
  ["Notifications", "Delivered through your browser or the app. You can turn them off in Account."],
  ["Sharing", "No ads and no data sales. Vehicle positions are public to signed-in commuters."],
];

export default function Privacy() {
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
        Privacy Policy
      </motion.h1>
      <dl className="flex flex-col gap-4">
        {rows.map(([term, detail]) => (
          <div key={term} className="flex flex-col gap-1">
            <dt className="text-body-md font-sans-medium">{term}</dt>
            <dd className="text-body-md text-text-secondary">{detail}</dd>
          </div>
        ))}
      </dl>
      <Link href="/login" className="self-start">
        <Button variant="secondary">Back to the app</Button>
      </Link>
    </main>
  );
}