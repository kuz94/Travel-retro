import React, { useState } from 'react';
import type { Spot, TravelMode } from '../types';
import { formatDuration } from '../utils/haversine';

interface Props {
  spot: Spot;
  index: number;
  selected: boolean;
  mode: TravelMode;
  onSelect: () => void;
  onDurationChange: (min: number) => void;
  onDelete: () => void;
  dragHandle?: React.ReactNode;
}

const TYPE_EMOJI: Record<string, string> = {
  viewpoint: '🔭', museum: '🏛️', park: '🌳', garden: '🌸',
  nature_reserve: '🌿', peak: '⛰️', hill: '🗻', beach: '🏖️',
  waterfall: '💧', marketplace: '🛒', cafe: '☕', historic: '🏰',
  artwork: '🎨',
};

function getEmoji(type: string): string {
  return TYPE_EMOJI[type] ?? '📍';
}

export default function SpotCard({ spot, index, selected, mode, onSelect, onDurationChange, onDelete, dragHandle }: Props) {
  const [editDur, setEditDur] = useState(false);
  const [durVal, setDurVal] = useState(String(spot.durationMin));

  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.coords.lat},${spot.coords.lon}&travelmode=${
    mode === 'walk' ? 'walking' : mode === 'car' ? 'driving' : 'transit'
  }`;

  const mapsFrom = spot.travelFromPrev && spot.travelFromPrev.distKm > 0.05;

  return (
    <div
      className={`spot-row ${selected ? 'selected' : ''} cursor-pointer`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-2 p-2">
        {dragHandle && <div className="drag-handle pt-1 select-none">{dragHandle}</div>}

        {/* Number */}
        <div
          className="text-white font-retro text-lg w-7 h-7 flex items-center justify-center flex-shrink-0"
          style={{ background: '#000080', border: '2px solid white', borderRadius: '50%', minWidth: 28 }}
        >
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          {/* Time + name */}
          <div className="flex items-center gap-2 flex-wrap">
            {spot.startTime && (
              <span className="font-retro text-lg text-retro-blue font-bold">{spot.startTime}</span>
            )}
            <span className="font-bold truncate">{getEmoji(spot.type)} {spot.name}</span>
          </div>

          {/* Travel from prev */}
          {mapsFrom && spot.travelFromPrev && (
            <div className="text-xs text-retro-dark mt-1">
              🚶 {formatDuration(spot.travelFromPrev.minutes)} — {spot.travelFromPrev.distKm.toFixed(1)} km depuis le spot précédent
            </div>
          )}

          {/* Duration */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs">⏱️</span>
            {editDur ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = parseInt(durVal);
                  if (!isNaN(v) && v > 0) onDurationChange(v);
                  setEditDur(false);
                }}
                onClick={(e) => e.stopPropagation()}
                className="flex gap-1"
              >
                <input
                  className="retro-input w-16"
                  value={durVal}
                  onChange={(e) => setDurVal(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="retro-btn retro-btn-sm">✓</button>
              </form>
            ) : (
              <button
                className="retro-btn retro-btn-sm"
                onClick={(e) => { e.stopPropagation(); setEditDur(true); }}
              >
                {formatDuration(spot.durationMin)}
              </button>
            )}

            <a
              href={gmapsUrl}
              target="_blank"
              rel="noreferrer"
              className="retro-btn retro-btn-sm"
              onClick={(e) => e.stopPropagation()}
            >
              🗺️ Itinéraire
            </a>

            <button
              className="retro-btn retro-btn-sm retro-btn-danger"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              ✕
            </button>
          </div>

          {/* Score reasons (collapsed) */}
          {selected && spot.scoreReasons && spot.scoreReasons.length > 0 && (
            <div className="mt-2 text-xs retro-card-inset p-1">
              {spot.scoreReasons.join(' · ')}
              <br />
              📍 {spot.coords.lat.toFixed(5)}, {spot.coords.lon.toFixed(5)}
              {spot.tags.website && (
                <><br />🌐 <a href={spot.tags.website} target="_blank" rel="noreferrer" className="underline">{spot.tags.website}</a></>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
