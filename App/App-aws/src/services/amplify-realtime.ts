import { amplifyAPI, type AmplifyLocation, type AmplifyAlert } from './amplify-api';

// Location update interface matching the old socket format
export interface LocationUpdate {
  childId: string;
  childName: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

// Alert interface matching the old socket format
export interface Alert {
  _id: string;
  type: string;
  message: string;
  timestamp: string;
  userId: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

// Subscription holder type
type Subscription = {
  unsubscribe: () => void;
};

class AmplifyRealtimeService {
  private locationSubscription: Subscription | null = null;
  private alertSubscription: Subscription | null = null;
  private locationCallbacks: Set<(data: LocationUpdate) => void> = new Set();
  private alertCallbacks: Set<(data: Alert) => void> = new Set();
  private parentId: string | null = null;
  private childNameMap: Map<string, string> = new Map();

  /**
   * Connect and setup subscriptions
   * @param userId - The user ID (parent or child)
   * @param userType - Type of user ('PARENT' or 'CHILD')
   */
  connect(userId: string, userType: string): void {
    console.log('Setting up Amplify subscriptions for user:', userId, 'type:', userType);
    
    if (userType === 'PARENT') {
      this.parentId = userId;
    }

    // Note: Actual subscription setup happens when joinFamily is called with childIds
  }

  /**
   * Join family room - sets up subscriptions for children's locations
   * @param _familyCode - The family code (not used in AppSync, but kept for compatibility)
   * @param childIds - Array of child user IDs to track
   * @param childNames - Optional map of child IDs to names
   */
  joinFamily(_familyCode: string, childIds: string[], childNames?: Map<string, string>): void {
    console.log('Joining family with children:', childIds);
    
    if (childNames) {
      this.childNameMap = childNames;
    }

    // Unsubscribe from previous location subscription if exists
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
    }

    // Subscribe to location updates for all children
    if (childIds.length > 0) {
      this.locationSubscription = amplifyAPI.subscribeToLocationUpdates(
        childIds,
        this.handleLocationUpdate.bind(this)
      );
    }

    // Subscribe to alerts if parent
    if (this.parentId && !this.alertSubscription) {
      this.alertSubscription = amplifyAPI.subscribeToAlerts(
        this.parentId,
        this.handleAlertReceived.bind(this)
      );
    }
  }

  /**
   * Handle incoming location updates from AppSync
   */
  private handleLocationUpdate(location: AmplifyLocation): void {
    const childName = this.childNameMap.get(location.userId) || 'Unknown Child';
    
    const update: LocationUpdate = {
      childId: location.userId,
      childName,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy || undefined,
      timestamp: location.timestamp,
    };

    // Notify all registered callbacks
    this.locationCallbacks.forEach(callback => callback(update));
  }

  /**
   * Handle incoming alerts from AppSync
   */
  private handleAlertReceived(alert: AmplifyAlert): void {
    const mappedAlert: Alert = {
      _id: alert.id,
      type: alert.type || 'UNKNOWN',
      message: alert.message || '',
      timestamp: alert.timestamp,
      userId: alert.userId,
      location: alert.location ? {
        latitude: alert.location.latitude,
        longitude: alert.location.longitude,
      } : undefined,
    };

    // Notify all registered callbacks
    this.alertCallbacks.forEach(callback => callback(mappedAlert));
  }

  /**
   * Register callback for location updates
   */
  onLocationUpdate(callback: (data: LocationUpdate) => void): void {
    this.locationCallbacks.add(callback);
  }

  /**
   * Register callback for alerts
   */
  onAlertReceived(callback: (data: Alert) => void): void {
    this.alertCallbacks.add(callback);
  }

  /**
   * Unregister callback for location updates
   */
  offLocationUpdate(callback?: (data: LocationUpdate) => void): void {
    if (callback) {
      this.locationCallbacks.delete(callback);
    } else {
      this.locationCallbacks.clear();
    }
  }

  /**
   * Unregister callback for alerts
   */
  offAlertReceived(callback?: (data: Alert) => void): void {
    if (callback) {
      this.alertCallbacks.delete(callback);
    } else {
      this.alertCallbacks.clear();
    }
  }

  /**
   * Disconnect and cleanup subscriptions
   */
  disconnect(): void {
    console.log('Disconnecting Amplify subscriptions');
    
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
      this.locationSubscription = null;
    }

    if (this.alertSubscription) {
      this.alertSubscription.unsubscribe();
      this.alertSubscription = null;
    }

    this.locationCallbacks.clear();
    this.alertCallbacks.clear();
    this.parentId = null;
    this.childNameMap.clear();
  }

  /**
   * Check if subscriptions are active
   */
  isConnected(): boolean {
    return this.locationSubscription !== null || this.alertSubscription !== null;
  }

  /**
   * Get a mock socket object (for compatibility, always returns null)
   */
  getSocket(): null {
    return null;
  }
}

export const amplifyRealtimeService = new AmplifyRealtimeService();
export default amplifyRealtimeService;
