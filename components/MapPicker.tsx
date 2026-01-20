'use client';

import { useState, useEffect, useRef } from 'react';
import { FaMapMarkerAlt, FaMap, FaSearch } from 'react-icons/fa';

interface MapPickerProps {
  center: { lat: number; lng: number };
  zoom: number;
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  selectedLocation?: { lat: number; lng: number } | null;
}

export default function MapPicker({ center, zoom, onLocationSelect, selectedLocation }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [currentCenter, setCurrentCenter] = useState(center);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualLat, setManualLat] = useState(selectedLocation?.lat.toString() || center.lat.toString());
  const [manualLng, setManualLng] = useState(selectedLocation?.lng.toString() || center.lng.toString());

  useEffect(() => {
    if (selectedLocation) {
      setManualLat(selectedLocation.lat.toFixed(6));
      setManualLng(selectedLocation.lng.toFixed(6));
      setCurrentCenter(selectedLocation);
    }
  }, [selectedLocation]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate relative position (0 to 1)
    const relX = x / rect.width;
    const relY = y / rect.height;

    // Convert to lat/lng offset (simplified calculation)
    // Adjust based on zoom level
    const zoomFactor = Math.pow(2, 18 - zoom);
    const latOffset = (0.5 - relY) * 0.01 / zoomFactor;
    const lngOffset = (relX - 0.5) * 0.01 / zoomFactor;

    const newLat = currentCenter.lat + latOffset;
    const newLng = currentCenter.lng + lngOffset;

    onLocationSelect({ lat: newLat, lng: newLng });
  };

  const handleManualCoordinates = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      onLocationSelect({ lat, lng });
      setCurrentCenter({ lat, lng });
    }
  };

  const handleCenterChange = (direction: 'n' | 's' | 'e' | 'w') => {
    const step = 0.01 / Math.pow(2, 18 - zoom);
    let newLat = currentCenter.lat;
    let newLng = currentCenter.lng;

    switch (direction) {
      case 'n':
        newLat += step;
        break;
      case 's':
        newLat -= step;
        break;
      case 'e':
        newLng += step;
        break;
      case 'w':
        newLng -= step;
        break;
    }

    setCurrentCenter({ lat: newLat, lng: newLng });
  };

  const handleZoomIn = () => {
    if (zoom < 18) {
      // Zoom is handled by parent, but we can adjust center
    }
  };

  const handleZoomOut = () => {
    if (zoom > 1) {
      // Zoom is handled by parent, but we can adjust center
    }
  };

  // Use OpenStreetMap static image as background
  const mapImageUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${currentCenter.lng - 0.01},${currentCenter.lat - 0.01},${currentCenter.lng + 0.01},${currentCenter.lat + 0.01}&layer=mapnik`;

  return (
    <div className="space-y-4">
      {/* Map Display */}
      <div className="relative w-full h-96 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100">
        {/* Clickable Map Area */}
        <div
          ref={mapRef}
          onClick={handleMapClick}
          className="absolute inset-0 cursor-crosshair z-10 bg-gray-200"
          style={{ 
            backgroundImage: `url(https://tile.openstreetmap.org/${Math.floor(zoom)}/${Math.floor((currentCenter.lng + 180) / 360 * Math.pow(2, zoom))}/${Math.floor((1 - Math.log(Math.tan(currentCenter.lat * Math.PI / 180) + 1 / Math.cos(currentCenter.lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))}.png)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Fallback: Use iframe with OpenStreetMap */}
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0, pointerEvents: 'none' }}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentCenter.lng - 0.01},${currentCenter.lat - 0.01},${currentCenter.lng + 0.01},${currentCenter.lat + 0.01}&layer=mapnik&marker=${selectedLocation ? `${selectedLocation.lat},${selectedLocation.lng}` : `${currentCenter.lat},${currentCenter.lng}`}`}
            allowFullScreen
            loading="lazy"
          />
        </div>

        {/* Marker at selected location */}
        {selectedLocation && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{
              left: '50%',
              top: '50%',
              marginTop: '-40px'
            }}
          >
            <FaMapMarkerAlt className="w-10 h-10 text-red-600 drop-shadow-2xl animate-pulse" />
          </div>
        )}

        {/* Navigation Controls */}
        <div className="absolute bottom-4 right-4 z-30 bg-white rounded-lg shadow-lg p-2 space-y-2">
          <button
            onClick={() => handleCenterChange('n')}
            className="block w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-bold text-sm"
            title="North"
          >
            ↑
          </button>
          <div className="flex space-x-2">
            <button
              onClick={() => handleCenterChange('w')}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-bold text-sm"
              title="West"
            >
              ←
            </button>
            <button
              onClick={() => handleCenterChange('e')}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-bold text-sm"
              title="East"
            >
              →
            </button>
          </div>
          <button
            onClick={() => handleCenterChange('s')}
            className="block w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-bold text-sm"
            title="South"
          >
            ↓
          </button>
        </div>

        {/* Instructions */}
        <div className="absolute top-4 left-4 z-30 bg-white bg-opacity-95 rounded-lg p-3 shadow-lg border border-gray-200">
          <p className="text-xs text-gray-700 font-medium flex items-center space-x-2">
            <FaMapMarkerAlt className="w-3 h-3 text-red-600" />
            <span>Click on the map to select location</span>
          </p>
        </div>
      </div>

      {/* Manual Coordinate Input */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-sm font-semibold text-gray-700 mb-3">Or enter coordinates manually:</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
            <input
              type="number"
              step="0.000001"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="41.2995"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
            <input
              type="number"
              step="0.000001"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="69.2401"
            />
          </div>
        </div>
        <button
          onClick={handleManualCoordinates}
          className="mt-3 w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
        >
          <FaSearch className="w-3 h-3" />
          <span>Set Location</span>
        </button>
      </div>
    </div>
  );
}
