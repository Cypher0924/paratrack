import { clockTime } from "./time";

export type NotificationCopy = { title: string; body: string };

const typeWord = (label: string) => label.replace(/\s*\d+\s*$/, "");

export const arrivalCopy = (a: { vehicleLabel: string; minutes: number; stopName: string; arrivesAt: Date; seatsLeft: number }): NotificationCopy => ({
  title: `${a.vehicleLabel} is ${a.minutes} min away`,
  body: `Head to ${a.stopName}. It arrives at ${clockTime(a.arrivesAt)} with ${a.seatsLeft} ${a.seatsLeft === 1 ? "seat" : "seats"} left.`,
});

export const paraCopy = (a: { stopName: string }): NotificationCopy => ({
  title: "Your stop is next",
  body: `Get ready to say "Para po" at ${a.stopName}.`,
});

export const fullCopy = (a: {
  vehicleLabel: string;
  routeName: string;
  nextLabel: string | null;
  stopName: string;
  nextMinutes: number | null;
}): NotificationCopy => ({
  title: `${a.vehicleLabel} is full`,
  body:
    a.nextLabel === null || a.nextMinutes === null
      ? `${a.routeName}. No other ${typeWord(a.vehicleLabel)} with seats is on the way yet.`
      : `${a.routeName}. The next ${typeWord(a.nextLabel)} with seats reaches ${a.stopName} in ${a.nextMinutes} min.`,
});

export const stoppedSharingCopy = (a: { vehicleLabel: string; routeName: string }): NotificationCopy => ({
  title: `${a.vehicleLabel} stopped sharing`,
  body: `The driver went offline. Check other vehicles on ${a.routeName}.`,
});
