import React from 'react';
import type { AnimeShop } from '../types';

interface Props {
  shop: AnimeShop;
  isFavorite: boolean;
  onToggleFav: () => void;
}

function scoreColor(s: number): string {
  if (s >= 70) return '#006600';
  if (s >= 45) return '#885500';
  return '#660000';
}

export default function AnimeShopCard({ shop, isFavorite, onToggleFav }: Props) {
  const gmaps = `https://www.google.com/maps/dir/?api=1&destination=${shop.coords.lat},${shop.coords.lon}&travelmode=transit`;
  const appleMaps = `http://maps.apple.com/?daddr=${shop.coords.lat},${shop.coords.lon}&dirflg=r`;

  return (
    <div className="retro-card mb-2 p-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold">🎌 {shop.name}</span>
            <span
              className="score-badge"
              style={{ color: scoreColor(shop.score), borderColor: scoreColor(shop.score) }}
            >
              Score: {shop.score}
            </span>
            {isFavorite && <span title="Favori">⭐</span>}
          </div>

          <div className="text-xs mt-1 text-retro-dark">
            🏪 {shop.type}
            {shop.distKm !== undefined && ` · 📏 ${shop.distKm < 1 ? `${Math.round(shop.distKm * 1000)}m` : `${shop.distKm.toFixed(1)}km`}`}
          </div>

          <div className="text-xs mt-1">{shop.scoreReasons.join(' · ')}</div>

          {shop.tags.address && (
            <div className="text-xs mt-1">📍 {shop.tags.address}</div>
          )}
          {shop.tags['addr:street'] && (
            <div className="text-xs mt-1">
              📍 {shop.tags['addr:housenumber'] ?? ''} {shop.tags['addr:street']}{shop.tags['addr:city'] ? `, ${shop.tags['addr:city']}` : ''}
            </div>
          )}
          {shop.tags.opening_hours && (
            <div className="text-xs mt-1">🕐 {shop.tags.opening_hours}</div>
          )}
          {shop.tags.website && (
            <div className="text-xs mt-1">
              🌐 <a href={shop.tags.website} target="_blank" rel="noreferrer" className="underline">{shop.tags.website}</a>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <button className="retro-btn retro-btn-sm" onClick={onToggleFav}>
            {isFavorite ? '★ Fav.' : '☆ Fav.'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mt-2 flex-wrap">
        <a href={gmaps} target="_blank" rel="noreferrer" className="retro-btn retro-btn-sm">
          🗺️ Google Maps
        </a>
        <a href={appleMaps} target="_blank" rel="noreferrer" className="retro-btn retro-btn-sm">
          🍎 Apple Plans
        </a>
      </div>
    </div>
  );
}
