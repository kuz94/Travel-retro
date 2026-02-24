import React, { useState } from 'react';
import type { Trip, TravelMode } from '../types';
import RetroWindow from '../components/RetroWindow';
import { geocodeCity } from '../utils/overpass';

interface Props {
  trips: Trip[];
  onSelectTrip: (id: string) => void;
  onCreateTrip: (trip: Trip) => void;
  onDeleteTrip: (id: string) => void;
}

const MODE_LABELS: Record<TravelMode, string> = {
  walk: '🚶 Marche',
  transit: '🚇 Transport',
  car: '🚗 Voiture',
};

export default function HomePage({ trips, onSelectTrip, onCreateTrip, onDeleteTrip }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [city, setCity] = useState('Paris, France');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [mode, setMode] = useState<TravelMode>('transit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!city.trim()) return;
    setLoading(true);
    setError('');
    const coords = await geocodeCity(city);
    setLoading(false);
    if (!coords) {
      setError('Ville introuvable. Essayez "Paris, France" ou "Tokyo, Japan".');
      return;
    }
    const trip: Trip = {
      id: Math.random().toString(36).slice(2),
      city: city.trim(),
      coords,
      startDate,
      endDate,
      mode,
      days: [],
      createdAt: Date.now(),
    };
    onCreateTrip(trip);
    setShowForm(false);
    setCity('Paris, France');
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="retro-title" style={{ fontSize: '3.5rem', lineHeight: 1 }}>
          🗺️ RETRO TRAVEL
        </h1>
        <p className="text-white font-body text-sm mt-1">
          Planificateur de voyages — Windows 95 Edition™
        </p>
      </div>

      {/* New trip button */}
      <RetroWindow title="Mes voyages" icon="📁">
        <button
          className="retro-btn retro-btn-primary mb-4"
          onClick={() => setShowForm(true)}
        >
          + Nouveau voyage
        </button>

        {trips.length === 0 ? (
          <div className="retro-card-inset p-3 text-center text-sm">
            Aucun voyage enregistré. Créez-en un !
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {trips.map((trip) => (
              <div key={trip.id} className="retro-card flex items-center justify-between gap-2 p-2">
                <div>
                  <div className="font-bold">📌 {trip.city}</div>
                  <div className="text-xs text-retro-dark">
                    {trip.startDate} → {trip.endDate} · {MODE_LABELS[trip.mode]} · {trip.days.length} jour(s) planifié(s)
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="retro-btn retro-btn-sm retro-btn-primary" onClick={() => onSelectTrip(trip.id)}>
                    Ouvrir
                  </button>
                  <button
                    className="retro-btn retro-btn-sm retro-btn-danger"
                    onClick={() => { if (confirm('Supprimer ce voyage ?')) onDeleteTrip(trip.id); }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </RetroWindow>

      {/* Create form */}
      {showForm && (
        <div className="mt-4">
          <RetroWindow title="Nouveau voyage" icon="✈️" onClose={() => setShowForm(false)}>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Ville / Destination</label>
                <input
                  className="retro-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Paris, France"
                  required
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <div className="flex-1">
                  <label className="block text-xs font-bold mb-1">Début</label>
                  <input type="date" className="retro-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold mb-1">Fin</label>
                  <input type="date" className="retro-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Mode de transport</label>
                <div className="flex gap-2 flex-wrap">
                  {(Object.entries(MODE_LABELS) as [TravelMode, string][]).map(([k, v]) => (
                    <button
                      key={k}
                      type="button"
                      className={`retro-btn ${mode === k ? 'active' : ''}`}
                      onClick={() => setMode(k)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              {error && <div className="retro-card-inset p-2 text-sm" style={{ color: '#800000' }}>{error}</div>}
              <div className="flex gap-2">
                <button type="submit" className="retro-btn retro-btn-primary" disabled={loading}>
                  {loading ? '⌛ Géolocalisation...' : '✓ Créer le voyage'}
                </button>
                <button type="button" className="retro-btn" onClick={() => setShowForm(false)}>
                  Annuler
                </button>
              </div>
            </form>
          </RetroWindow>
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-6 text-white text-xs opacity-70">
        Données : OpenStreetMap · Nominatim · Pas de compte requis
      </div>
    </div>
  );
}
