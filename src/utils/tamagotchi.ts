import { TamagotchiState } from "../types";

/**
 * Applies fast depletion to Tamagotchi stats based on elapsed time.
 * Depletion rate is calibrated to go from 100 to 0 in exactly 30 minutes.
 * There are 120 steps of 15 seconds in 30 minutes (30 * 4 = 120).
 * Rate per 15 seconds: 100 / 120 = 5/6 points (~0.83 points)
 */
export function applyDepletion(
  tamagotchi: TamagotchiState,
  nowIso = new Date().toISOString()
): { updated: boolean; tamagotchi: TamagotchiState } {
  const cloned = { ...tamagotchi };
  
  // Fall back to a sensible timestamp if last_updated is missing
  const lastUpdatedStr = cloned.last_updated || new Date().toISOString();
  
  const lastUpdated = new Date(lastUpdatedStr).getTime();
  const now = new Date(nowIso).getTime();
  const elapsedMs = now - lastUpdated;
  
  const intervalMs = 15 * 1000; // 15 seconds
  const steps = Math.floor(elapsedMs / intervalMs);
  
  if (steps > 0) {
    const loss = (5 * steps) / 6;
    cloned.hunger = Math.max(0, Math.round((cloned.hunger - loss) * 10) / 10);
    cloned.happiness = Math.max(0, Math.round((cloned.happiness - loss) * 10) / 10);
    cloned.energy = Math.max(0, Math.round((cloned.energy - loss) * 10) / 10);
    
    // Set the new last_updated to exact step boundary to preserve fractional ms
    cloned.last_updated = new Date(lastUpdated + steps * intervalMs).toISOString();
    return { updated: true, tamagotchi: cloned };
  }
  
  if (!cloned.last_updated) {
    cloned.last_updated = nowIso;
    return { updated: true, tamagotchi: cloned };
  }
  
  return { updated: false, tamagotchi: cloned };
}
