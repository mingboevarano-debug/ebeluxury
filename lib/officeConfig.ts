// Office location configuration
// Update these coordinates to match your office location
export const OFFICE_LOCATION = {
  latitude: 41.2995, // Default: Tashkent, Uzbekistan
  longitude: 69.2401,
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
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
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

