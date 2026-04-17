'use client';

import { useEffect, useRef, useState } from 'react';
import { FaHardHat } from 'react-icons/fa';

const TASHKENT_CENTER = { lat: 41.2995, lng: 69.2401 };
const PROJECT_LOCATIONS = [
  { lat: 41.309321, lng: 69.205954, label: 'KOX OTA' },
  { lat: 41.297323, lng: 69.238395, label: 'NRG SADO' },
  { lat: 41.328063, lng: 69.255614, label: 'ISTANBUL CITY' },
];

const LEAFLET_SCRIPT = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

export default function ProjectsMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ remove: () => void } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    const initMap = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (window as any).L;
      if (!L || !containerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(containerRef.current).setView(
        [TASHKENT_CENTER.lat, TASHKENT_CENTER.lng],
        14
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      PROJECT_LOCATIONS.forEach((loc) => {
        const label = loc.label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const projectIcon = L.divIcon({
          className: 'custom-project-marker',
          html: `<div class="project-marker-pin"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0ea5e9" width="56" height="56"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg><span class="project-marker-label">${label}</span></div>`,
          iconSize: [64, 72],
          iconAnchor: [32, 72],
          popupAnchor: [0, -72],
        });
        L.marker([loc.lat, loc.lng], { icon: projectIcon })
          .addTo(map)
          .bindPopup(`<div class="map-popup"><strong>${loc.label}</strong><br/><span class="map-popup-coords">${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}</span></div>`);
      });

      mapRef.current = map;
      setLoaded(true);
    };

    const loadScript = (): Promise<void> => {
      if ((window as unknown as { L?: unknown }).L) return Promise.resolve();
      const existing = document.querySelector(`script[src="${LEAFLET_SCRIPT}"]`);
      if (existing) return Promise.resolve();

      return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = LEAFLET_CSS;
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = LEAFLET_SCRIPT;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Leaflet'));
        document.head.appendChild(script);
      });
    };

    loadScript()
      .then(initMap)
      .catch((e) => setError(e instanceof Error ? e.message : 'Map failed to load'));

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-slate-800/50 rounded-xl border border-white/10">
        <p className="text-red-400 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-[calc(100vh-12rem)] sm:min-h-[calc(100vh-11rem)] rounded-xl overflow-hidden">
      <div ref={containerRef} className="w-full h-full min-h-[calc(100vh-12rem)] sm:min-h-[calc(100vh-11rem)]" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/90">
          <div className="flex flex-col items-center gap-4">
            <FaHardHat className="w-14 h-14 text-sky-400 animate-pulse" />
            <span className="text-slate-300 font-medium">Xarita yuklanmoqda...</span>
          </div>
        </div>
      )}
    </div>
  );
}
