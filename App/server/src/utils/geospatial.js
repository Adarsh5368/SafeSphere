// Haversine formula to calculate distance between two points
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const earthRadius = 6371000; // meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

// Convert degrees to radians
export const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Convert radians to degrees
export const toDegrees = (radians) => {
  return radians * (180 / Math.PI);
};

// Check if a point is inside a circular geofence
export const isPointInGeofence = (pointLat, pointLon, centerLat, centerLon, radius) => {
  const distance = calculateDistance(pointLat, pointLon, centerLat, centerLon);
  return distance <= radius;
};

// Validate coordinates
export const validateCoordinates = (latitude, longitude) => {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new Error('Coordinates must be numbers');
  }
  
  if (latitude < -90 || latitude > 90) {
    throw new Error('Latitude must be between -90 and 90 degrees');
  }
  
  if (longitude < -180 || longitude > 180) {
    throw new Error('Longitude must be between -180 and 180 degrees');
  }
};

// Validate and sanitize location accuracy
export const validateAccuracy = (accuracy) => {
  if (accuracy === null || accuracy === undefined) {
    return 0;
  }
  
  const numAccuracy = Number(accuracy);
  if (isNaN(numAccuracy) || numAccuracy < 0) {
    throw new Error('Accuracy must be a non-negative number');
  }
  
  return numAccuracy;
};

// Check if location is recent enough
export const validateLocationAge = (timestamp, maxAgeMs = 600000) => {
  const locationDate = new Date(timestamp);
  const now = new Date();
  const age = now - locationDate;
  
  // Allow timestamps slightly in the future (up to 60 seconds) due to clock differences
  if (age < -60000) {
    throw new Error(`Location timestamp is too far in the future`);
  }
  
  // Allow older timestamps (up to 10 minutes)
  if (age > maxAgeMs) {
    throw new Error(`Location data is too old (${Math.round(age / 1000)}s ago)`);
  }
  
  return true;
};

// Format location for display
export const formatLocation = (latitude, longitude, precision = 4) => {
  return {
    latitude: Number(latitude.toFixed(precision)),
    longitude: Number(longitude.toFixed(precision))
  };
};

// Calculate bearing between two points
export const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  const bearingRad = Math.atan2(y, x);
  return (toDegrees(bearingRad) + 360) % 360;
};

// Generate a bounding box around a point
export const generateBoundingBox = (centerLat, centerLon, radiusMeters) => {
  const earthRadius = 6371000;
  const latDelta = (radiusMeters / earthRadius) * (180 / Math.PI);
  const lonDelta = (radiusMeters / earthRadius) * (180 / Math.PI) / Math.cos(centerLat * Math.PI / 180);
  
  return {
    north: centerLat + latDelta,
    south: centerLat - latDelta,
    east: centerLon + lonDelta,
    west: centerLon - lonDelta
  };
};