import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(isoString: string | null): string {
  if (!isoString) return "—";
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

type RelativeTime =
  | { unit: "justNow" }
  | { unit: "seconds"; count: number }
  | { unit: "minutes"; count: number };

export function getRelativeTime(lastUpdated: Date): RelativeTime {
  const diffMs = Date.now() - lastUpdated.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 5) {
    return { unit: "justNow" };
  }
  if (diffSeconds < 60) {
    return { unit: "seconds", count: diffSeconds };
  }
  return { unit: "minutes", count: Math.floor(diffSeconds / 60) };
}
