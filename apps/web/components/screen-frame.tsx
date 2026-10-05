"use client";

import { Suspense, type ReactNode } from "react";

/**
 * Web shell for a shared app screen. The Figma screens are a 390 wide phone layout, so the app is
 * rendered in a centered column of that width and the full viewport height; narrower viewports get
 * the full width. Native apps use the device screen directly.
 *
 * The Suspense boundary is what lets a screen call `useQuery()` (`useSearchParams`) while the page
 * is still prerendered.
 */
export function ScreenFrame({ children }: { children: ReactNode }) {
  return (
    <main className="flex h-[100dvh] w-full justify-center bg-surface-muted">
      <div className="h-full w-full max-w-[390px] overflow-hidden bg-background">
        <Suspense fallback={null}>{children}</Suspense>
      </div>
    </main>
  );
}