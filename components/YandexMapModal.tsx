'use client';

import { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaExternalLinkAlt, FaTimes, FaCheck } from 'react-icons/fa';
import { useLanguage } from '@/contexts/LanguageContext';

const DEFAULT_CENTER = { lat: 41.2995, lng: 69.2401 }; // Tashkent
const DEFAULT_ZOOM = 14;

interface YandexMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  initialLocation?: { lat: number; lng: number } | null;
}

/**
 * Parse coordinates from Yandex Maps URL or raw coordinate string.
 * Yandex uses ll= and pt= with format: longitude,latitude
 * Manual input typically uses: latitude,longitude
 */
function parseCoordinatesFromInput(input: string): { lat: number; lng: number } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try to parse from URL (ll= or pt= parameters - Yandex uses lng,lat)
  try {
    if (trimmed.includes('yandex') || trimmed.includes('ll=') || trimmed.includes('pt=')) {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://dummy.com/?${trimmed}`);
      const ll = url.searchParams.get('ll') || url.searchParams.get('pt');
      if (ll) {
        const parts = ll.split(',').map((s) => parseFloat(s.trim()));
        if (parts.length >= 2 && !parts.some(isNaN)) {
          const [lng, lat] = parts;
          if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return { lat, lng };
          }
        }
      }
    }

    // Parse raw coordinates: "41.31, 69.24" or "41.31 69.24" (assume lat,lng)
    const parts = trimmed.split(/[\s,;]+/).map((s) => parseFloat(s.trim()));
    if (parts.length >= 2 && !parts.some(isNaN)) {
      const [a, b] = parts;
      // Heuristic: lat is -90 to 90, lng is -180 to 180
      // For Uzbekistan: lat ~41, lng ~69
      if (Math.abs(a) <= 90 && Math.abs(b) <= 180) {
        return { lat: a, lng: b };
      }
      if (Math.abs(b) <= 90 && Math.abs(a) <= 180) {
        return { lat: b, lng: a };
      }
      // Default: first is lat, second is lng
      return { lat: a, lng: b };
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

export default function YandexMapModal({
  isOpen,
  onClose,
  onLocationSelect,
  initialLocation,
}: YandexMapModalProps) {
  const { t } = useLanguage();
  const [pasteInput, setPasteInput] = useState('');
  const [parseError, setParseError] = useState('');
  const [currentCenter, setCurrentCenter] = useState(
    initialLocation || DEFAULT_CENTER
  );
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  useEffect(() => {
    if (initialLocation) {
      setCurrentCenter(initialLocation);
    }
  }, [initialLocation]);

  const openInNewTabUrl = `https://yandex.ru/maps/?ll=${currentCenter.lng},${currentCenter.lat}&z=${zoom}`;

  const handleApply = () => {
    setParseError('');
    const coords = parseCoordinatesFromInput(pasteInput);
    if (coords) {
      onLocationSelect(coords);
      setCurrentCenter(coords);
      setPasteInput('');
      onClose();
    } else {
      setParseError((t as (k: string) => string)('meetings.yandex_parse_error') || 'Could not parse coordinates. Paste a Yandex Maps URL or enter coordinates as "lat, lng" (e.g. 41.31, 69.24)');
    }
  };

  const handleUseCurrent = () => {
    onLocationSelect(currentCenter);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-amber-50">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <FaMapMarkerAlt className="w-5 h-5 text-yellow-600" />
            {(t as (k: string) => string)('meetings.yandex_map_title') || 'Select Location with Yandex Maps'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Close"
          >
            <FaTimes className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Instructions - Yandex blocks iframe embedding, so we use "open in new tab" workflow */}
        <div className="px-4 sm:px-5 py-4 sm:py-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
            <p className="font-medium mb-2">{(t as (k: string) => string)('meetings.yandex_instructions_title') || 'How to get coordinates:'}</p>
            <ol className="list-decimal list-inside space-y-1.5 text-amber-800">
              <li>{(t as (k: string) => string)('meetings.yandex_step1_new') || 'Click the button below to open Yandex Maps in a new tab'}</li>
              <li>{(t as (k: string) => string)('meetings.yandex_step2') || 'Click "Share" / "Copy link" on Yandex Maps'}</li>
              <li>{(t as (k: string) => string)('meetings.yandex_step3') || 'Paste the link below — we\'ll extract coordinates automatically'}</li>
              <li>{(t as (k: string) => string)('meetings.yandex_step4') || 'Or enter coordinates manually:'} <code className="bg-amber-100 px-1 rounded">41.31, 69.24</code></li>
            </ol>
          </div>

          {/* Open Yandex Maps button - iframe is blocked by Yandex, so we open in new tab */}
          <a
            href={openInNewTabUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <FaExternalLinkAlt className="w-6 h-6" />
            <span>{(t as (k: string) => string)('meetings.yandex_open_map') || 'Open Yandex Maps'}</span>
          </a>
        </div>

        {/* Paste / Coordinates input */}
        <div className="p-4 sm:p-5 border-t border-gray-200 space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {(t as (k: string) => string)('meetings.yandex_paste_label') || 'Paste Yandex Maps link or coordinates (lat, lng):'}
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={pasteInput}
                onChange={(e) => {
                  setPasteInput(e.target.value);
                  setParseError('');
                }}
                placeholder={(t as (k: string) => string)('meetings.yandex_paste_placeholder') || 'https://yandex.ru/maps/... or 41.2995, 69.2401'}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
              />
              <button
                onClick={handleApply}
                className="px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 flex-shrink-0"
              >
                <FaCheck className="w-4 h-4" />
                {(t as (k: string) => string)('meetings.yandex_use_location') || 'Use this location'}
              </button>
            </div>
            {parseError && (
              <p className="mt-2 text-sm text-red-600">{parseError}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleUseCurrent}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm"
            >
              {(t as (k: string) => string)('meetings.yandex_use_center') || 'Use map center'} ({currentCenter.lat.toFixed(4)}, {currentCenter.lng.toFixed(4)})
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg text-sm"
            >
              {(t as (k: string) => string)('foreman.cancel') || 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
