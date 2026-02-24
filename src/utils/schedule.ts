import type { Spot, DayPlan, TravelMode } from '../types';
import { haversineKm, travelMinutes, addMinutes } from './haversine';

const START_TIME = '09:00';
const BREAK_DURATION = 60; // lunch break in minutes
const BREAK_AFTER = 3;     // spots before lunch

/** Build a full day plan: compute times, travel from prev, etc. */
export function buildSchedule(
  spots: Spot[],
  mode: TravelMode,
  startPoint?: { lat: number; lon: number }
): DayPlan {
  let currentTime = START_TIME;
  let breakInserted = false;

  const scheduled: Spot[] = spots.map((spot, i) => {
    // Travel from previous spot (or start point)
    let travelFromPrev: Spot['travelFromPrev'] | undefined;
    const prevCoords = i === 0
      ? (startPoint ?? spot.coords)
      : spots[i - 1].coords;

    const distKm = haversineKm(prevCoords, spot.coords);
    const minutes = i === 0 && !startPoint ? 0 : travelMinutes(distKm, mode);

    travelFromPrev = { distKm, minutes };
    currentTime = addMinutes(currentTime, minutes);

    // Insert lunch break after Nth spot
    if (!breakInserted && i === BREAK_AFTER) {
      currentTime = addMinutes(currentTime, BREAK_DURATION);
      breakInserted = true;
    }

    const scheduled: Spot = {
      ...spot,
      startTime: currentTime,
      travelFromPrev,
    };

    currentTime = addMinutes(currentTime, spot.durationMin);
    return scheduled;
  });

  return {
    id: Math.random().toString(36).slice(2),
    date: new Date().toISOString().split('T')[0],
    spots: scheduled,
  };
}

/** Rebuild schedule in-place (after reorder or duration change) */
export function rebuildSchedule(day: DayPlan, mode: TravelMode): DayPlan {
  return buildSchedule(day.spots, mode, day.startPoint);
}
