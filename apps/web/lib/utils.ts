import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRateLimitReset(reset: number, now: number = Date.now()): string {
  let msLeft = reset - now;
  if (msLeft < 0) msLeft = 0;

  const secondsLeft = Math.floor(msLeft / 1000);
  const minutesLeft = Math.floor(secondsLeft / 60);
  const remainingSeconds = secondsLeft % 60;

  if (minutesLeft === 0) {
    return `${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`;
  }

  if (remainingSeconds === 0) {
    return `${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""}`;
  }

  return `${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""} and ${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`;
}