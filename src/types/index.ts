export type TravelMode = 'walk' | 'transit' | 'car';

export interface Coords {
  lat: number;
  lon: number;
}

export interface Spot {
  id: string;
  name: string;
  type: string; // amenity, leisure, tourism, etc.
  tags: Record<string, string>;
  coords: Coords;
  durationMin: number; // time to spend here
  startTime?: string;  // "09:00"
  travelFromPrev?: {
    distKm: number;
    minutes: number;
  };
  score?: number;
  scoreReasons?: string[];
}

export interface DayPlan {
  id: string;
  date: string; // "2024-06-15"
  spots: Spot[];
  startPoint?: Coords;
}

export interface Trip {
  id: string;
  city: string;
  country?: string;
  coords: Coords;
  startDate: string;
  endDate: string;
  mode: TravelMode;
  days: DayPlan[];
  createdAt: number;
}

export interface AnimeShop {
  id: string;
  name: string;
  type: string;
  tags: Record<string, string>;
  coords: Coords;
  distKm?: number;
  score: number;
  scoreReasons: string[];
  isFavorite?: boolean;
}
