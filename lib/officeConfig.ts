// Office location configuration
// Update these coordinates to match your office location
export const OFFICE_LOCATION = {
  latitude: 41.344453,
  longitude: 69.276341,
  radius: 100, // Radius in meters - employee must be within this distance to be considered "at office"
  name: 'Main Office',
  address: 'Tashkent, Uzbekistan'
};

// Office working hours
export const WORKING_HOURS = {
  startTime: '09:00', // 9:00 AM
  endTime: '18:00',   // 6:00 PM
  lateThreshold: 15,  // Minutes after start time to be considered "late"
  earlyThreshold: 30 // Minutes before start time to be considered "early"
};

// Calculate distance between two coordinates (Haversine formula)
// Returns distance in meters
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Check if location is within office radius
export function isWithinOfficeRadius(
  userLat: number,
  userLng: number
): boolean {
  const distance = calculateDistance(
    userLat,
    userLng,
    OFFICE_LOCATION.latitude,
    OFFICE_LOCATION.longitude
  );
  return distance <= OFFICE_LOCATION.radius;
}

// Result of a location verification check
export interface LocationCheckResult {
  lat: number;
  lng: number;
  distance: number;
  withinRadius: boolean;
  accuracy: number | null;
  accuracyAcceptable: boolean; // true if GPS accuracy is good enough to trust the result
}

// Get current location with high accuracy (single source of truth for all checks)
export function getCurrentLocation(): Promise<{ lat: number; lng: number; accuracy: number | null }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
        });
      },
      (error) => {
        const msg = error.code === 1 ? 'Permission denied' : error.code === 2 ? 'Position unavailable' : 'Timeout';
        reject(new Error(`Location error: ${msg}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0, // Never use cached position - always get fresh reading
      }
    );
  });
}

// Verify if user is at office - single accurate check used by both modal and check-in
export function verifyOfficeLocation(
  userLat: number,
  userLng: number,
  accuracy: number | null
): LocationCheckResult {
  const distance = calculateDistance(
    userLat,
    userLng,
    OFFICE_LOCATION.latitude,
    OFFICE_LOCATION.longitude
  );
  const withinRadius = distance <= OFFICE_LOCATION.radius;
  // GPS accuracy must be better than radius to trust the result (avoid false positives from poor GPS)
  const accuracyAcceptable = accuracy === null || accuracy <= OFFICE_LOCATION.radius * 1.5;
  return {
    lat: userLat,
    lng: userLng,
    distance,
    withinRadius,
    accuracy,
    accuracyAcceptable,
  };
}

// Determine attendance status based on check-in time
export function getAttendanceStatus(checkInTime: Date): 'present' | 'late' | 'early' {
  const [hours, minutes] = WORKING_HOURS.startTime.split(':').map(Number);
  const startTime = new Date(checkInTime);
  startTime.setHours(hours, minutes, 0, 0);

  const diffMinutes = (checkInTime.getTime() - startTime.getTime()) / (1000 * 60);

  if (diffMinutes > WORKING_HOURS.lateThreshold) {
    return 'late';
  } else if (diffMinutes < -WORKING_HOURS.earlyThreshold) {
    return 'early';
  } else {
    return 'present';
  }
}

