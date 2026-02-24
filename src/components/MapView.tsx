import React, { useEffect, useRef } from 'react';
import type { Spot, AnimeShop } from '../types';

interface Props {
  center: { lat: number; lon: number };
  spots?: Spot[];
  shops?: AnimeShop[];
  selectedId?: string;
  onSelectSpot?: (id: string) => void;
  height?: string;
}

// Dynamic import of Leaflet to avoid SSR issues
let L: typeof import('leaflet') | null = null;

export default function MapView({ center, spots = [], shops = [], selectedId, onSelectSpot, height = '350px' }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null);
  const markersRef = useRef<import('leaflet').Marker[]>([]);

  useEffect(() => {
    import('leaflet').then((leaflet) => {
      L = leaflet.default ?? leaflet;

      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current).setView([center.lat, center.lon], 14);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
    });

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when spots/shops change
  useEffect(() => {
    if (!mapInstanceRef.current || !L) return;
    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Spot markers (blue)
    spots.forEach((spot, i) => {
      if (!L) return;
      const icon = L.divIcon({
        html: `<div style="
          background:${spot.id === selectedId ? '#ff4400' : '#000080'};
          color:white;font-family:VT323,monospace;font-size:14px;
          width:26px;height:26px;border-radius:50%;border:2px solid white;
          display:flex;align-items:center;justify-content:center;
          box-shadow:2px 2px 4px rgba(0,0,0,0.5);
          cursor:pointer;
        ">${i + 1}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        className: '',
      });
      const marker = L.marker([spot.coords.lat, spot.coords.lon], { icon })
        .addTo(map)
        .bindPopup(`<b>${spot.name}</b><br/><small>${spot.type}</small>`);
      if (onSelectSpot) marker.on('click', () => onSelectSpot(spot.id));
      markersRef.current.push(marker);
    });

    // Shop markers (pink)
    shops.forEach((shop) => {
      if (!L) return;
      const icon = L.divIcon({
        html: `<div style="
          background:#cc0066;color:white;font-size:14px;
          width:26px;height:26px;border-radius:4px;border:2px solid white;
          display:flex;align-items:center;justify-content:center;
          box-shadow:2px 2px 4px rgba(0,0,0,0.5);
        ">🎌</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        className: '',
      });
      const marker = L.marker([shop.coords.lat, shop.coords.lon], { icon })
        .addTo(map)
        .bindPopup(`<b>${shop.name}</b><br/><small>${shop.type} — Score: ${shop.score}</small>`);
      markersRef.current.push(marker);
    });

    // Draw route line for spots
    if (spots.length > 1 && L) {
      const latlngs = spots.map((s) => [s.coords.lat, s.coords.lon] as [number, number]);
      const poly = L.polyline(latlngs, { color: '#000080', weight: 2, dashArray: '5,5', opacity: 0.6 }).addTo(map);
      (poly as unknown as import('leaflet').Marker & { _isRoute?: boolean })._isRoute = true;
      markersRef.current.push(poly as unknown as import('leaflet').Marker);
    }

    // Fit bounds
    if (spots.length > 0 || shops.length > 0) {
      const allCoords = [
        ...spots.map((s) => [s.coords.lat, s.coords.lon] as [number, number]),
        ...shops.map((s) => [s.coords.lat, s.coords.lon] as [number, number]),
      ];
      if (allCoords.length > 0) {
        map.fitBounds(L.latLngBounds(allCoords), { padding: [30, 30] });
      }
    }
  }, [spots, shops, selectedId, onSelectSpot]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: '100%', border: '2px solid #808080' }}
      className="retro-card-inset"
    />
  );
}
