const fmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });

// Some ICU builds put a narrow no-break space before AM/PM.
export const clockTime = (date: Date): string => fmt.format(date).replace(/[\u202f\u00a0]/g, " ");

export const updatedAgo = (updatedAt: Date, now: Date): string => {
  const s = Math.floor((now.getTime() - updatedAt.getTime()) / 1000);
  if (s < 5) return "updated just now";
  if (s < 60) return `updated ${s} sec ago`;
  if (s < 3600) return `updated ${Math.floor(s / 60)} min ago`;
  return `updated ${Math.floor(s / 3600)} hr ago`;
};
