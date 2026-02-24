import LZString from 'lz-string';
import type { Trip } from '../types';

const MAX_URL = 7000; // safe limit for most browsers

export function encodeTrip(trip: Trip): string | null {
  const json = JSON.stringify(trip);
  const compressed = LZString.compressToEncodedURIComponent(json);
  const url = `${window.location.origin}/?trip=${compressed}`;
  if (url.length > MAX_URL) return null;
  return url;
}

export function decodeTripFromURL(): Trip | null {
  const params = new URLSearchParams(window.location.search);
  const data = params.get('trip');
  if (!data) return null;
  try {
    const json = LZString.decompressFromEncodedURIComponent(data);
    if (!json) return null;
    return JSON.parse(json) as Trip;
  } catch {
    return null;
  }
}
