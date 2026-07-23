import { CountdownState } from "../types";

export const TARGET_REUNION_DATE = "2026-09-16T00:00:00Z";

export function calculateCountdown(targetDateStr: string = TARGET_REUNION_DATE): CountdownState {
  const target = new Date(targetDateStr).getTime();
  const now = new Date().getTime();
  const diffMs = Math.max(0, target - now);

  const days_remaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours_remaining = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes_remaining = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    target_date: targetDateStr,
    days_remaining,
    hours_remaining,
    minutes_remaining,
  };
}
