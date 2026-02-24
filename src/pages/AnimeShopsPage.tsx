import React, { useState } from 'react';
import type { AnimeShop } from '../types';
import RetroWindow from '../components/RetroWindow';
import MapView from '../components/MapView';
import AnimeShopCard from '../components/AnimeShopCard';
import { fetchAnimeShops, geocodeCity } from '../utils/overpass';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function AnimeShopsPage() {
  const [city, setCity] = useState('Paris, France');
  const [radius, setRadius] = useState(3000);
  const [shops, setShops] = useState<AnimeShop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [center, setCenter] = useState({ lat: 48.8566, lon: 2.3522 });
  const [favorites, setFavorites] = useLocalStorage<string[]>('anime-favs', []);
  const [filterFav, setFilterFav] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShops([]);
    try {
      const coords = await geocodeCity(city);
      if (!coords) { setError('Ville introuvable.'); setLoading(false); return; }
      setCenter(coords);
      const results = await fetchAnimeShops(coords, radius);
      setShops(results);
      if (results.length === 0) {
        setError('Aucune boutique trouvée dans ce rayon. Essayez d\'élargir la zone, ou cherchez dans une autre ville (Tokyo, Akihabara, Paris…).');
      }
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.');
    }
    setLoading(false);
  }

  function toggleFav(id: string) {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }

  const displayed = filterFav ? shops.filter((s) => favorites.includes(s.id)) : shops;

  return (
    <div className="max-w-5xl mx-auto p-3">
      <h2 className="retro-title text-3xl mb-3">🎌 Boutiques Anime & Figurines</h2>

      <RetroWindow title="Recherche" icon="🔍">
        <form onSubmit={handleSearch} className="flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1">
              <label className="block text-xs font-bold mb-1">Ville</label>
              <input
                className="retro-input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Tokyo, Japan"
              />
            </div>
            <div style={{ width: 150 }}>
              <label className="block text-xs font-bold mb-1">Rayon</label>
              <select
                className="retro-input"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
              >
                <option value={1000}>1 km</option>
                <option value={2000}>2 km</option>
                <option value={3000}>3 km</option>
                <option value={5000}>5 km</option>
                <option value={10000}>10 km</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="retro-btn retro-btn-primary" disabled={loading}>
              {loading ? '⌛ Recherche…' : '🔍 Chercher'}
            </button>
            {shops.length > 0 && (
              <button
                type="button"
                className={`retro-btn ${filterFav ? 'active' : ''}`}
                onClick={() => setFilterFav((v) => !v)}
              >
                ★ Favoris ({favorites.length})
              </button>
            )}
          </div>
        </form>

        {error && (
          <div className="retro-card-inset p-2 mt-2 text-sm" style={{ color: '#800000' }}>
            ⚠️ {error}
            <br />
            <span className="text-xs">
              💡 Conseil : OpenStreetMap n'a pas toutes les boutiques. Si vous cherchez à Tokyo, essayez "Akihabara, Tokyo" · À Paris, "Rue des Archives" ou "Quartier Latin" peuvent donner des résultats.
            </span>
          </div>
        )}
      </RetroWindow>

      {shops.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
          {/* List */}
          <div>
            <RetroWindow title={`Résultats (${displayed.length})`} icon="📋">
              <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                {displayed.length === 0 ? (
                  <div className="retro-card-inset p-3 text-center text-sm">
                    {filterFav ? 'Aucun favori dans cette recherche.' : 'Aucun résultat.'}
                  </div>
                ) : (
                  displayed.map((shop) => (
                    <AnimeShopCard
                      key={shop.id}
                      shop={shop}
                      isFavorite={favorites.includes(shop.id)}
                      onToggleFav={() => toggleFav(shop.id)}
                    />
                  ))
                )}
              </div>

              {/* Legend */}
              <div className="mt-2 retro-card-inset p-2 text-xs">
                <b>Score "intérêt touriste" :</b><br />
                <span style={{ color: '#006600' }}>■ 70+ Très pertinent</span> ·{' '}
                <span style={{ color: '#885500' }}>■ 45-69 Intéressant</span> ·{' '}
                <span style={{ color: '#660000' }}>■ &lt;45 À vérifier</span>
              </div>
            </RetroWindow>
          </div>

          {/* Map */}
          <div>
            <RetroWindow title="Carte" icon="🗺️">
              <MapView
                center={center}
                shops={displayed}
                height="400px"
              />
            </RetroWindow>
          </div>
        </div>
      )}
    </div>
  );
}
