import type { Coords, Spot, AnimeShop } from '../types';
import { haversineKm } from './haversine';

const OVERPASS = 'https://overpass-api.de/api/interpreter';

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ────────────────────────────────────────────────────────────
//  GEOCODING via Nominatim
// ────────────────────────────────────────────────────────────
export async function geocodeCity(city: string): Promise<Coords | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

// ────────────────────────────────────────────────────────────
//  POI SCORING (less-touristy preference)
// ────────────────────────────────────────────────────────────
function scoreSpot(tags: Record<string, string>): { score: number; reasons: string[] } {
  let score = 50;
  const reasons: string[] = [];

  // Prefer local/nature
  const tourism = tags.tourism ?? '';
  const leisure = tags.leisure ?? '';
  const amenity = tags.amenity ?? '';
  const natural = tags.natural ?? '';
  const historic = tags.historic ?? '';

  if (tourism === 'attraction' || tourism === 'theme_park') { score -= 20; reasons.push('⚠️ très touristique'); }
  if (tourism === 'viewpoint') { score += 15; reasons.push('✓ point de vue'); }
  if (tourism === 'museum') { score += 5; reasons.push('✓ musée'); }
  if (leisure === 'park' || leisure === 'garden') { score += 12; reasons.push('✓ parc'); }
  if (leisure === 'nature_reserve') { score += 18; reasons.push('✓ réserve naturelle'); }
  if (natural === 'peak' || natural === 'hill') { score += 16; reasons.push('✓ point élevé'); }
  if (natural === 'beach') { score += 14; reasons.push('✓ plage'); }
  if (natural === 'waterfall') { score += 18; reasons.push('✓ cascade'); }
  if (amenity === 'marketplace' || tags.shop === 'market') { score += 10; reasons.push('✓ marché local'); }
  if (historic) { score += 8; reasons.push(`✓ historique (${historic})`); }
  if (amenity === 'cafe') { score += 5; reasons.push('✓ café local'); }
  if (tags['name:wikidata']) { score += 5; reasons.push('✓ lieu notable'); }
  if (!tags.name) { score -= 30; } // no name = skip

  return { score: Math.max(0, Math.min(100, score)), reasons };
}

// Duration per type (minutes)
function defaultDuration(tags: Record<string, string>): number {
  const leisure = tags.leisure ?? '';
  const tourism = tags.tourism ?? '';
  const amenity = tags.amenity ?? '';
  const natural = tags.natural ?? '';
  if (leisure === 'park' || leisure === 'garden') return 60;
  if (leisure === 'nature_reserve') return 90;
  if (tourism === 'museum') return 90;
  if (tourism === 'viewpoint') return 30;
  if (natural) return 45;
  if (amenity === 'marketplace') return 45;
  if (amenity === 'cafe') return 30;
  return 45;
}

// ────────────────────────────────────────────────────────────
//  OVERPASS QUERY FOR TRAVEL SPOTS
// ────────────────────────────────────────────────────────────
export async function fetchSpots(center: Coords, radiusM = 5000): Promise<Spot[]> {
  const query = `
[out:json][timeout:30];
(
  node["tourism"~"viewpoint|museum|artwork"](around:${radiusM},${center.lat},${center.lon});
  node["leisure"~"park|garden|nature_reserve"](around:${radiusM},${center.lat},${center.lon});
  node["natural"~"peak|hill|beach|waterfall|spring"](around:${radiusM},${center.lat},${center.lon});
  node["amenity"~"marketplace"](around:${radiusM},${center.lat},${center.lon});
  node["historic"](around:${radiusM},${center.lat},${center.lon});
  way["leisure"~"park|garden|nature_reserve"](around:${radiusM},${center.lat},${center.lon});
  way["tourism"~"viewpoint|museum"](around:${radiusM},${center.lat},${center.lon});
  relation["leisure"~"park|nature_reserve"](around:${radiusM},${center.lat},${center.lon});
);
out center 80;
`;

  const res = await fetch(OVERPASS, {
    method: 'POST',
    body: query,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  const data = await res.json();

  const spots: Spot[] = [];
  for (const el of data.elements ?? []) {
    const tags: Record<string, string> = el.tags ?? {};
    if (!tags.name) continue;
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!lat || !lon) continue;

    const { score, reasons } = scoreSpot(tags);
    if (score < 20) continue;

    spots.push({
      id: uid(),
      name: tags.name,
      type: tags.tourism ?? tags.leisure ?? tags.natural ?? tags.amenity ?? tags.historic ?? 'lieu',
      tags,
      coords: { lat, lon },
      durationMin: defaultDuration(tags),
      score,
      scoreReasons: reasons,
    });
  }

  return spots;
}

// ────────────────────────────────────────────────────────────
//  ANIME SHOPS QUERY
// ────────────────────────────────────────────────────────────
const ANIME_NAME_KEYWORDS = [
  'manga', 'anime', 'figurine', 'figure', 'otaku', 'hobby', 'tcg',
  'trading card', 'collectible', 'gunpla', 'model kit', 'cosplay',
  'japanime', 'japan', 'akiba', 'animate', 'nakano', 'comic', 'bd',
  'geek', 'gamer', 'gaming',
];

function scoreAnimeShop(tags: Record<string, string>, distKm: number): { score: number; reasons: string[] } {
  let score = 30;
  const reasons: string[] = [];

  const shop = tags.shop ?? '';
  const name = (tags.name ?? '').toLowerCase();

  if (shop === 'anime') { score += 35; reasons.push('+ shop=anime'); }
  else if (shop === 'collector') { score += 30; reasons.push('+ shop=collector'); }
  else if (shop === 'comic') { score += 28; reasons.push('+ shop=comic'); }
  else if (shop === 'hobby') { score += 25; reasons.push('+ shop=hobby'); }
  else if (shop === 'toy') { score += 20; reasons.push('+ shop=toy'); }
  else if (shop === 'games' || shop === 'video_games') { score += 18; reasons.push(`+ shop=${shop}`); }
  else if (shop === 'gift') { score += 10; reasons.push('+ shop=gift'); }
  else if (shop === 'variety_store') { score += 8; reasons.push('+ shop=variety_store'); }

  // Name match bonus
  for (const kw of ANIME_NAME_KEYWORDS) {
    if (name.includes(kw)) {
      score += 15;
      reasons.push(`+ nom contient "${kw}"`);
      break;
    }
  }

  // Contact info = active business
  if (tags.website) { score += 5; reasons.push('+ site web'); }
  if (tags.phone) { score += 3; reasons.push('+ téléphone'); }
  if (tags.opening_hours) { score += 3; reasons.push('+ horaires renseignés'); }

  // Distance penalty
  if (distKm > 5) { score -= 10; reasons.push('- éloigné'); }
  else if (distKm > 2) { score -= 3; }

  return { score: Math.max(0, Math.min(100, score)), reasons };
}

export async function fetchAnimeShops(center: Coords, radiusM = 3000): Promise<AnimeShop[]> {
  const query = `
[out:json][timeout:30];
(
  node["shop"~"anime|collector|comic|hobby|toy|games|video_games|gift|variety_store"](around:${radiusM},${center.lat},${center.lon});
  way["shop"~"anime|collector|comic|hobby|toy|games|video_games|gift|variety_store"](around:${radiusM},${center.lat},${center.lon});
);
out center 100;
`;

  const res = await fetch(OVERPASS, {
    method: 'POST',
    body: query,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  const data = await res.json();

  const shops: AnimeShop[] = [];
  for (const el of data.elements ?? []) {
    const tags: Record<string, string> = el.tags ?? {};
    if (!tags.name) continue;
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!lat || !lon) continue;

    const distKm = haversineKm(center, { lat, lon });
    const { score, reasons } = scoreAnimeShop(tags, distKm);

    shops.push({
      id: uid(),
      name: tags.name,
      type: tags.shop ?? 'boutique',
      tags,
      coords: { lat, lon },
      distKm,
      score,
      scoreReasons: reasons,
    });
  }

  return shops.sort((a, b) => b.score - a.score);
}
