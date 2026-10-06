/** Fixes less accurate than this are dropped before `driver_ping`. Indoor fixes jumped ~700 m on the test phone. */
export const MAX_FIX_ACCURACY_M = 50;

/** A fix without a reported accuracy is kept. */
export const usableFix = (accuracyM: number | null | undefined): boolean =>
  accuracyM == null || accuracyM <= MAX_FIX_ACCURACY_M;

/** Seconds between pings while sharing. */
export const PING_INTERVAL_S = 5;
