import type { Spot } from '../types';
import { haversineKm } from './haversine';

/** Nearest-neighbor greedy TSP starting from first spot */
export function optimizeRoute(spots: Spot[]): Spot[] {
  if (spots.length <= 2) return spots;

  const remaining = [...spots.slice(1)];
  const result = [spots[0]];

  while (remaining.length > 0) {
    const last = result[result.length - 1];
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(last.coords, remaining[i].coords);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    result.push(remaining[bestIdx]);
    remaining.splice(bestIdx, 1);
  }

  return result;
}
