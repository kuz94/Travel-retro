import React, { useState, useEffect } from 'react';
import type { Trip } from './types';
import HomePage from './pages/HomePage';
import TripPage from './pages/TripPage';
import AnimeShopsPage from './pages/AnimeShopsPage';
import { useLocalStorage } from './hooks/useLocalStorage';
import { decodeTripFromURL } from './utils/share';

type Tab = 'home' | 'anime';
type View = 'list' | 'trip';

export default function App() {
  const [trips, setTrips] = useLocalStorage<Trip[]>('retro-trips', []);
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [view, setView] = useState<View>('list');
  const [tab, setTab] = useState<Tab>('home');

  // Load shared trip from URL on first load
  useEffect(() => {
    const shared = decodeTripFromURL();
    if (shared) {
      // Check if not already saved
      setTrips((prev) => {
        if (prev.find((t) => t.id === shared.id)) return prev;
        return [...prev, shared];
      });
      setCurrentTripId(shared.id);
      setView('trip');
      setTab('home');
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentTrip = trips.find((t) => t.id === currentTripId) ?? null;

  function handleSelectTrip(id: string) {
    setCurrentTripId(id);
    setView('trip');
    setTab('home');
  }

  function handleCreateTrip(trip: Trip) {
    setTrips((prev) => [...prev, trip]);
    setCurrentTripId(trip.id);
    setView('trip');
  }

  function handleDeleteTrip(id: string) {
    setTrips((prev) => prev.filter((t) => t.id !== id));
    if (currentTripId === id) { setCurrentTripId(null); setView('list'); }
  }

  function handleUpdateTrip(updated: Trip) {
    setTrips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setCurrentTripId(updated.id);
  }

  function handleBack() {
    setView('list');
    setCurrentTripId(null);
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 40 }}>
      {/* Taskbar-style top nav */}
      <div className="retro-card" style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none', marginBottom: 0 }}>
        <div className="flex items-center gap-1 px-2 py-1 flex-wrap">
          <span className="font-retro text-xl mr-3">🗺️ RetroTravel</span>
          <button
            className={`retro-tab ${tab === 'home' && view !== 'trip' ? 'active' : ''}`}
            onClick={() => { setTab('home'); setView('list'); setCurrentTripId(null); }}
          >
            📁 Mes voyages
          </button>
          {currentTrip && (
            <button
              className={`retro-tab ${view === 'trip' ? 'active' : ''}`}
              onClick={() => setView('trip')}
            >
              ✈️ {currentTrip.city}
            </button>
          )}
          <button
            className={`retro-tab ${tab === 'anime' ? 'active' : ''}`}
            onClick={() => { setTab('anime'); setView('list'); }}
          >
            🎌 Boutiques Anime
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="pt-4">
        {tab === 'anime' && view !== 'trip' ? (
          <AnimeShopsPage />
        ) : view === 'trip' && currentTrip ? (
          <TripPage trip={currentTrip} onUpdate={handleUpdateTrip} onBack={handleBack} />
        ) : (
          <HomePage
            trips={trips}
            onSelectTrip={handleSelectTrip}
            onCreateTrip={handleCreateTrip}
            onDeleteTrip={handleDeleteTrip}
          />
        )}
      </div>

      {/* Status bar */}
      <div
        className="retro-card fixed bottom-0 left-0 right-0 text-xs flex gap-4 px-3 py-1"
        style={{ borderBottom: 'none', borderLeft: 'none', borderRight: 'none' }}
      >
        <span>✅ {trips.length} voyage(s) sauvegardé(s) en local</span>
        <span style={{ marginLeft: 'auto' }}>Données : OpenStreetMap · Sans compte · Sans API key</span>
      </div>
    </div>
  );
}
