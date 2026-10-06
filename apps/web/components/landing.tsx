"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { Button } from "@/components/arc/button/button";
import { motionTokens } from "@/components/arc/motion-tokens";
import { Logo } from "@repo/ui/src/components/Brand";
import { TransitMap } from "@repo/ui/src/components/Map";
import type { MapVehicleItem } from "@repo/ui/src/components/Map.types";
import { useLiveVehicles, useRoutes } from "@repo/ui/src/data/hooks";
import { marker } from "@repo/ui/src/screens/commuter/shared";

const APK_URL = "https://github.com/Cypher0924/paratrack/releases/latest/download/paratrack.apk";

// The ParaTrack accent on primary buttons. Arc's primary button fills with --foreground.
const accent = "[--foreground:theme(colors.accent)]";

/** Fades and rises into view once. Reduced motion keeps a short fade and drops the movement. */
function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduced = useReducedMotion() ?? false;
  return (
    <motion.div
      className={className}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: reduced ? motionTokens.duration.instant : motionTokens.duration.considered, delay: reduced ? 0 : delay, ease: [...motionTokens.ease.enter] }}
    >
      {children}
    </motion.div>
  );
}

/** Read-only live map of Tarlac. Without Google Maps keys it shows the app's placeholder. */
function MapPreview() {
  const { data: routes } = useRoutes();
  const { vehicles } = useLiveVehicles();
  const items = useMemo(
    () =>
      vehicles
        .map((v) => marker(v, routes?.find((r) => r.id === v.route_id)))
        .filter((m): m is MapVehicleItem => m !== null),
    [vehicles, routes],
  );
  const paths = useMemo(() => (routes ?? []).map((r) => ({ id: r.id, path: r.path.map(([lng, lat]) => ({ lat, lng })) })), [routes]);
  return (
    <div className="flex flex-col gap-3">
      <div
        role="region"
        aria-label="Live map of Tarlac City"
        className="relative h-[360px] overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface-muted md:h-[480px]"
      >
        <TransitMap routes={paths} vehicles={items} fit={items.length > 1 ? items : undefined} />
      </div>
      <p className="text-body-sm text-text-secondary" aria-live="polite">
        {items.length === 0 ? "No vehicles are sharing their location right now." : `${items.length} ${items.length === 1 ? "vehicle" : "vehicles"} online now.`}
      </p>
    </div>
  );
}

const steps = ["Open this site in Safari on your iPhone.", "Tap the Share button.", "Choose Add to Home Screen."];

export function Landing() {
  const reduced = useReducedMotion() ?? false;
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-4 px-6 py-5">
        <Logo height={32} />
        <nav className="flex items-center gap-2" aria-label="Main">
          <a href="#get-the-app" className="hidden sm:block">
            <Button variant="ghost" size="sm">Get the app</Button>
          </a>
          <Link href="/start">
            <Button size="sm" className={accent}>Open the web app</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-[1120px] items-center gap-10 px-6 pb-16 pt-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-12 md:pb-24 md:pt-14">
          <motion.div
            className="flex flex-col items-start gap-6"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? motionTokens.duration.instant : motionTokens.duration.considered, ease: [...motionTokens.ease.enter] }}
          >
            <h1 className="text-title-lg font-sans-medium md:text-display-xl">Know when your ride arrives</h1>
            <p className="max-w-[460px] text-body-md text-text-secondary">
              ParaTrack shows live jeepneys, e-jeeps, buses and campus shuttles in Tarlac City: where each vehicle is, when it reaches your stop, how many seats are left and the LTFRB fare. Track a ride and get an alert before it arrives.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/start">
                <Button size="lg" className={accent}>Open the web app</Button>
              </Link>
              <a href="#get-the-app">
                <Button size="lg" variant="secondary">Get the app</Button>
              </a>
            </div>
          </motion.div>
          <Reveal delay={0.08}>
            <MapPreview />
          </Reveal>
        </section>

        <section id="get-the-app" className="scroll-mt-4 border-t border-border bg-surface-muted">
          <div className="mx-auto w-full max-w-[1120px] px-6 py-16 md:py-24">
            <Reveal>
              <h2 className="text-title-md font-sans-medium md:text-title-lg">Get the app</h2>
              <p className="mt-3 max-w-[520px] text-body-md text-text-secondary">Install ParaTrack on your phone, or use it in any browser.</p>
            </Reveal>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <Reveal className="flex flex-col items-start gap-4 rounded-[var(--radius-panel)] border border-border bg-surface p-6 md:p-8">
                <h3 className="text-title-sm font-sans-medium">Android</h3>
                <p className="text-body-md text-text-secondary">Download the APK, open it and allow installs from your browser when Android asks.</p>
                <a href={APK_URL} download>
                  <Button className={accent}>Download the APK</Button>
                </a>
              </Reveal>
              <Reveal delay={0.06} className="flex flex-col items-start gap-4 rounded-[var(--radius-panel)] border border-border bg-surface p-6 md:p-8">
                <h3 className="text-title-sm font-sans-medium">iPhone</h3>
                <p className="text-body-md text-text-secondary">The web app installs from Safari. No App Store needed.</p>
                <ol className="flex flex-col gap-3">
                  {steps.map((s, i) => (
                    <li key={s} className="flex items-baseline gap-3 text-body-md">
                      <span className="w-5 shrink-0 text-text-muted">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-6 text-body-sm text-text-secondary">
          <p>ParaTrack, a Tarlac City prototype.</p>
          <nav className="flex gap-5" aria-label="Legal">
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
