// API Configuration
export const API_ENDPOINTS = {
  // Auth
  SIGNUP: '/auth/signup',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  UPDATE_ME: '/auth/updateMe',
  UPDATE_PASSWORD: '/auth/updateMyPassword',
  FORGOT_PASSWORD: '/auth/forgotPassword',
  RESET_PASSWORD: '/auth/resetPassword',
  CREATE_CHILD: '/auth/createChild',
  DEACTIVATE_CHILD: '/auth/deactivateChild',
  JOIN_FAMILY: '/auth/joinFamily',

  // Locations
  LOCATIONS: '/locations',
  CHILDREN_LOCATIONS: '/locations/children',
  LOCATION_HISTORY: (userId: string) => `/locations/history/${userId}`,
  CURRENT_LOCATION: (userId: string) => `/locations/current/${userId}`,

  // Geofences
  GEOFENCES: '/geofences',
  GEOFENCE_BY_ID: (id: string) => `/geofences/${id}`,
  GEOFENCE_STATES: (childId: string) => `/geofences/states/${childId}`,
  CHILD_GEOFENCES: (childId: string) => `/geofences/child/${childId}`,

  // Alerts
  PANIC_ALERT: '/alerts/panic',
  ALERTS: '/alerts',
  RECENT_ALERTS: '/alerts/recent',
  ALERT_STATS: '/alerts/stats',
  MARK_AS_READ: '/alerts/markAsRead',
  MARK_ALL_AS_READ: '/alerts/markAllAsRead',
  ALERT_BY_ID: (id: string) => `/alerts/${id}`,

  // Users
  USER_PROFILE: '/users/profile',
  DASHBOARD: '/users/dashboard',
  FAMILY: '/users/family',
  TRUSTED_CONTACTS: '/users/trustedContacts',
  USER_SEARCH: '/users/search',
  USER_ACTIVITY: (userId: string) => `/users/activity/${userId}`,
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'Safe Sphere',
  LOCATION_UPDATE_INTERVAL: 30000, // 30 seconds
  ALERT_POLL_INTERVAL: 30000, // 30 seconds
  MAP_DEFAULT_ZOOM: 15,
  GEOFENCE_MAX_RADIUS: 10000, // 10km
  GEOFENCE_MIN_RADIUS: 1, // 1 meter
};

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: 'safesphere_theme',
  LAST_LOCATION: 'safesphere_last_location',
  USER_PREFERENCES: 'safesphere_user_preferences',
};

// Alert Types
export const ALERT_TYPES = {
  PANIC: 'PANIC',
  GEOFENCE_ENTRY: 'GEOFENCE_ENTRY',
  GEOFENCE_EXIT: 'GEOFENCE_EXIT',
  LOW_BATTERY: 'LOW_BATTERY',
  LOCATION_LOST: 'LOCATION_LOST',
} as const;

// User Types
export const USER_TYPES = {
  PARENT: 'PARENT',
  CHILD: 'CHILD',
} as const;

export type AlertType = typeof ALERT_TYPES[keyof typeof ALERT_TYPES];
export type UserType = typeof USER_TYPES[keyof typeof USER_TYPES];