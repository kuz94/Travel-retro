import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { Trip, DayPlan, Spot } from '../types';
import RetroWindow from '../components/RetroWindow';
import MapView from '../components/MapView';
import SpotCard from '../components/SpotCard';
import { fetchSpots } from '../utils/overpass';
import { buildSchedule, rebuildSchedule } from '../utils/schedule';
import { optimizeRoute } from '../utils/optimize';
import { encodeTrip } from '../utils/share';

interface Props {
  trip: Trip;
  onUpdate: (t: Trip) => void;
  onBack: () => void;
}

// ── Sortable item wrapper ──
function SortableSpot({
  spot, index, selectedId, trip, day, onSelectSpot, onDeleteSpot, onDurationChange,
}: {
  spot: Spot;
  index: number;
  selectedId: string;
  trip: Trip;
  day: DayPlan;
  onSelectSpot: (id: string) => void;
  onDeleteSpot: (id: string) => void;
  onDurationChange: (id: string, min: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: spot.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <SpotCard
        spot={spot}
        index={index}
        selected={selectedId === spot.id}
        mode={trip.mode}
        onSelect={() => onSelectSpot(spot.id)}
        onDurationChange={(min) => onDurationChange(spot.id, min)}
        onDelete={() => onDeleteSpot(spot.id)}
        dragHandle={<span {...listeners} className="drag-handle text-lg">⠿</span>}
      />
    </div>
  );
}

export default function TripPage({ trip, onUpdate, onBack }: Props) {
  const [activeDay, setActiveDay] = useState<DayPlan | null>(trip.days[0] ?? null);
  const [selectedSpotId, setSelectedSpotId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [addSpotName, setAddSpotName] = useState('');
  const [error, setError] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Persist helper ──
  function saveTrip(updatedTrip: Trip, updatedDay?: DayPlan) {
    let t = updatedTrip;
    if (updatedDay) {
      const days = t.days.map((d) => (d.id === updatedDay.id ? updatedDay : d));
      if (!days.find((d) => d.id === updatedDay.id)) days.push(updatedDay);
      t = { ...t, days };
    }
    onUpdate(t);
    if (updatedDay) setActiveDay(updatedDay);
  }

  // ── Generate day ──
  async function generateDay() {
    setLoading(true);
    setError('');
    setLoadMsg('🔍 Recherche de spots sur OpenStreetMap…');
    try {
      const raw = await fetchSpots(trip.coords, 5000);
      setLoadMsg('📊 Sélection et tri des spots…');

      // Sort by score, take top 8, unique by name
      const seen = new Set<string>();
      const best = raw
        .filter((s) => { if (seen.has(s.name)) return false; seen.add(s.name); return true; })
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 8);

      if (best.length === 0) {
        setError('Aucun spot trouvé dans un rayon de 5 km. Essayez une autre ville.');
        return;
      }

      setLoadMsg('🗓️ Construction du planning…');
      const day = buildSchedule(best, trip.mode, trip.coords);
      day.date = new Date().toISOString().split('T')[0];
      saveTrip(trip, day);
    } catch (e) {
      setError('Erreur réseau. Vérifiez votre connexion et réessayez.');
    } finally {
      setLoading(false);
      setLoadMsg('');
    }
  }

  // ── Optimize ──
  function optimizeDay() {
    if (!activeDay) return;
    const optimized = optimizeRoute(activeDay.spots);
    const rebuilt = rebuildSchedule({ ...activeDay, spots: optimized }, trip.mode);
    saveTrip(trip, rebuilt);
  }

  // ── Drag end ──
  function handleDragEnd(event: DragEndEvent) {
    if (!activeDay) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = activeDay.spots.findIndex((s) => s.id === active.id);
    const newIndex = activeDay.spots.findIndex((s) => s.id === over.id);
    const newSpots = arrayMove(activeDay.spots, oldIndex, newIndex);
    const rebuilt = rebuildSchedule({ ...activeDay, spots: newSpots }, trip.mode);
    saveTrip(trip, rebuilt);
  }

  // ── Duration change ──
  function handleDurationChange(spotId: string, min: number) {
    if (!activeDay) return;
    const newSpots = activeDay.spots.map((s) => s.id === spotId ? { ...s, durationMin: min } : s);
    const rebuilt = rebuildSchedule({ ...activeDay, spots: newSpots }, trip.mode);
    saveTrip(trip, rebuilt);
  }

  // ── Delete spot ──
  function handleDeleteSpot(spotId: string) {
    if (!activeDay) return;
    const newSpots = activeDay.spots.filter((s) => s.id !== spotId);
    const rebuilt = rebuildSchedule({ ...activeDay, spots: newSpots }, trip.mode);
    saveTrip(trip, rebuilt);
    if (selectedSpotId === spotId) setSelectedSpotId('');
  }

  // ── Add custom spot ──
  function handleAddSpot(e: React.FormEvent) {
    e.preventDefault();
    if (!activeDay || !addSpotName.trim()) return;
    const spot: Spot = {
      id: Math.random().toString(36).slice(2),
      name: addSpotName.trim(),
      type: 'custom',
      tags: {},
      coords: trip.coords,
      durationMin: 60,
    };
    const newSpots = [...activeDay.spots, spot];
    const rebuilt = rebuildSchedule({ ...activeDay, spots: newSpots }, trip.mode);
    saveTrip(trip, rebuilt);
    setAddSpotName('');
  }

  // ── Share ──
  function handleShare() {
    const url = encodeTrip(trip);
    if (!url) {
      alert('Le voyage est trop grand pour être partagé par URL. Essayez avec moins de jours.');
      return;
    }
    setShareUrl(url);
    navigator.clipboard?.writeText(url).catch(() => {});
  }

  const spots = activeDay?.spots ?? [];

  return (
    <div className="max-w-5xl mx-auto p-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <button className="retro-btn" onClick={onBack}>← Retour</button>
        <h2 className="retro-title text-3xl flex-1">📌 {trip.city}</h2>
        <span className="text-white text-sm">{trip.startDate} → {trip.endDate}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left — planning */}
        <div>
          <RetroWindow title="Planning journée" icon="📅">
            {/* Actions */}
            <div className="flex gap-1 flex-wrap mb-3">
              <button
                className="retro-btn retro-btn-primary"
                onClick={generateDay}
                disabled={loading}
              >
                {loading ? '⌛' : '⚡'} Générer une journée
              </button>
              {activeDay && (
                <button className="retro-btn" onClick={optimizeDay}>
                  🔀 Optimiser
                </button>
              )}
              <button className="retro-btn" onClick={handleShare}>
                🔗 Partager
              </button>
            </div>

            {/* Loading */}
            {loading && (
              <div className="retro-card-inset p-2 text-sm mb-2">
                <span className="blink">▮</span> {loadMsg}
              </div>
            )}

            {error && (
              <div className="retro-card-inset p-2 text-sm mb-2" style={{ color: '#800000' }}>
                ⚠️ {error}
              </div>
            )}

            {/* Share URL */}
            {shareUrl && (
              <div className="retro-card-inset p-2 text-xs mb-2 break-all">
                ✅ URL copiée ! <a href={shareUrl} className="underline">{shareUrl.slice(0, 60)}…</a>
                <button className="retro-btn retro-btn-sm ml-2" onClick={() => setShareUrl('')}>✕</button>
              </div>
            )}

            {/* Spot list */}
            {spots.length > 0 ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={spots.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="retro-card-inset">
                    {spots.map((spot, i) => (
                      <SortableSpot
                        key={spot.id}
                        spot={spot}
                        index={i}
                        selectedId={selectedSpotId}
                        trip={trip}
                        day={activeDay!}
                        onSelectSpot={setSelectedSpotId}
                        onDeleteSpot={handleDeleteSpot}
                        onDurationChange={handleDurationChange}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : !loading && (
              <div className="retro-card-inset p-3 text-center text-sm">
                Cliquez sur "Générer une journée" pour commencer
              </div>
            )}

            {/* Add spot */}
            {activeDay && (
              <form onSubmit={handleAddSpot} className="flex gap-1 mt-2">
                <input
                  className="retro-input"
                  placeholder="Ajouter un spot manuellement…"
                  value={addSpotName}
                  onChange={(e) => setAddSpotName(e.target.value)}
                />
                <button type="submit" className="retro-btn retro-btn-primary">+</button>
              </form>
            )}
          </RetroWindow>
        </div>

        {/* Right — map */}
        <div>
          <RetroWindow title="Carte" icon="🗺️">
            <MapView
              center={trip.coords}
              spots={spots}
              selectedId={selectedSpotId}
              onSelectSpot={setSelectedSpotId}
              height="400px"
            />
            <div className="text-xs mt-1 text-retro-dark">
              Cliquez sur un marqueur ou une ligne de la liste pour voir les détails.
            </div>
          </RetroWindow>
        </div>
      </div>
    </div>
  );
}
