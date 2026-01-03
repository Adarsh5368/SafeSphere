import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

// Generate the Amplify Data client
const client = generateClient<Schema>();

// Type definitions for our app
export interface AmplifyUser {
  id: string;
  email: string;
  name: string;
  userType: 'PARENT' | 'CHILD';
  parentId?: string | null;
  childIds?: string[] | null;
  familyCode?: string | null;
  phone?: string | null;
  isActive?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AmplifyLocation {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp: string;
  speed?: number | null;
  heading?: number | null;
}

export interface AmplifyGeofence {
  id: string;
  parentId: string;
  name: string;
  centerLat: number;
  centerLon: number;
  radius: number;
  isActive?: boolean | null;
  childId?: string | null;
  notifyOnEntry?: boolean | null;
  notifyOnExit?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AmplifyAlert {
  id: string;
  userId: string;
  parentId: string;
  type?: 'PANIC' | 'GEOFENCE_ENTRY' | 'GEOFENCE_EXIT' | 'LOW_BATTERY' | null;
  location?: { latitude: number; longitude: number } | null;
  geofenceId?: string | null;
  geofenceName?: string | null;
  message?: string | null;
  isRead?: boolean | null;
  timestamp: string;
}

// Amplify GraphQL API service wrapper
export const amplifyAPI = {
  // Export client for direct access when needed
  client,

  // ==================== USER OPERATIONS ====================
  
  // Get current user profile
  async getCurrentUser(userId: string): Promise<AmplifyUser | null> {
    try {
      const { data } = await client.models.User.get({ id: userId });
      return data as AmplifyUser | null;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },

  // Get user with children (parent view)
  async getUserWithChildren(userId: string): Promise<{ children: AmplifyUser[] } | null> {
    try {
      const { data } = await client.queries.getUserWithChildren({ userId });
      return data ? JSON.parse(data as string) : null;
    } catch (error) {
      console.error('Error fetching user with children:', error);
      throw error;
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<AmplifyUser>): Promise<AmplifyUser | null> {
    try {
      const { data } = await client.models.User.update({
        id: userId,
        ...updates,
      });
      return data as AmplifyUser | null;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Create child user
  async createChildUser(input: {
    name: string;
    parentId: string;
    parentEmail: string;
    age?: number;
  }): Promise<AmplifyUser | null> {
    try {
      const { data } = await client.mutations.createChildUser(input);
      return data ? JSON.parse(data as string) : null;
    } catch (error) {
      console.error('Error creating child user:', error);
      throw error;
    }
  },

  // Deactivate child
  async deactivateChild(childId: string): Promise<{ success: boolean } | null> {
    try {
      const { data } = await client.mutations.deactivateChild({ childId });
      return data ? JSON.parse(data as string) : null;
    } catch (error) {
      console.error('Error deactivating child:', error);
      throw error;
    }
  },

  // ==================== LOCATION OPERATIONS ====================
  
  // Record location (child device)
  async recordLocation(input: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: string;
  }): Promise<AmplifyLocation | null> {
    try {
      const { data } = await client.mutations.recordLocation(input);
      return data as AmplifyLocation | null;
    } catch (error) {
      console.error('Error recording location:', error);
      throw error;
    }
  },

  // Get children's latest locations
  async getChildrenLocations(childIds: string[]): Promise<AmplifyLocation[]> {
    try {
      const { data } = await client.queries.getChildrenLocations({ childIds });
      return (data || []) as AmplifyLocation[];
    } catch (error) {
      console.error('Error fetching children locations:', error);
      throw error;
    }
  },

  // Get location history for a user
  async getLocationHistory(
    userId: string,
    startTime: string,
    endTime: string
  ): Promise<AmplifyLocation[]> {
    try {
      const { data } = await client.queries.getLocationHistory({
        userId,
        startTime,
        endTime,
      });
      return (data || []) as AmplifyLocation[];
    } catch (error) {
      console.error('Error fetching location history:', error);
      throw error;
    }
  },

  // ==================== GEOFENCE OPERATIONS ====================
  
  // Create geofence
  async createGeofence(input: {
    name: string;
    centerLat: number;
    centerLon: number;
    radius: number;
    childId?: string;
  }): Promise<AmplifyGeofence | null> {
    try {
      const { data } = await client.mutations.setupGeofence(input);
      return data as AmplifyGeofence | null;
    } catch (error) {
      console.error('Error creating geofence:', error);
      throw error;
    }
  },

  // Get geofences by parent
  async getGeofencesByParent(parentId: string): Promise<AmplifyGeofence[]> {
    try {
      const { data } = await client.models.Geofence.list({
        filter: { parentId: { eq: parentId } },
      });
      return (data || []) as AmplifyGeofence[];
    } catch (error) {
      console.error('Error fetching geofences:', error);
      throw error;
    }
  },

  // Update geofence
  async updateGeofence(
    geofenceId: string,
    updates: Partial<AmplifyGeofence>
  ): Promise<AmplifyGeofence | null> {
    try {
      const { data } = await client.models.Geofence.update({
        id: geofenceId,
        ...updates,
      });
      return data as AmplifyGeofence | null;
    } catch (error) {
      console.error('Error updating geofence:', error);
      throw error;
    }
  },

  // Delete geofence
  async deleteGeofence(geofenceId: string): Promise<void> {
    try {
      await client.models.Geofence.delete({ id: geofenceId });
    } catch (error) {
      console.error('Error deleting geofence:', error);
      throw error;
    }
  },

  // ==================== ALERT OPERATIONS ====================
  
  // Trigger panic alert
  async triggerPanic(input: {
    latitude: number;
    longitude: number;
    message?: string;
  }): Promise<AmplifyAlert | null> {
    try {
      const { data } = await client.mutations.triggerPanic(input);
      return data as AmplifyAlert | null;
    } catch (error) {
      console.error('Error triggering panic:', error);
      throw error;
    }
  },

  // Get alerts by parent
  async getAlertsByParent(parentId: string, limit = 50): Promise<AmplifyAlert[]> {
    try {
      const { data } = await client.models.Alert.list({
        filter: { parentId: { eq: parentId } },
        limit,
      });
      return (data || []) as AmplifyAlert[];
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  },

  // Mark alert as read
  async markAlertAsRead(alertId: string): Promise<AmplifyAlert | null> {
    try {
      const { data } = await client.models.Alert.update({
        id: alertId,
        isRead: true,
      });
      return data as AmplifyAlert | null;
    } catch (error) {
      console.error('Error marking alert as read:', error);
      throw error;
    }
  },

  // ==================== SUBSCRIPTIONS ====================
  
  // Subscribe to location updates for specific children
  subscribeToLocationUpdates(
    childIds: string[],
    callback: (location: AmplifyLocation) => void
  ) {
    const subscription = client.models.Location.onCreate({
      filter: {
        or: childIds.map(id => ({ userId: { eq: id } })),
      },
    }).subscribe({
      next: (data) => {
        if (data) {
          callback(data as AmplifyLocation);
        }
      },
      error: (error) => console.error('Location subscription error:', error),
    });

    return subscription;
  },

  // Subscribe to new alerts for a parent
  subscribeToAlerts(parentId: string, callback: (alert: AmplifyAlert) => void) {
    const subscription = client.models.Alert.onCreate({
      filter: { parentId: { eq: parentId } },
    }).subscribe({
      next: (data) => {
        if (data) {
          callback(data as AmplifyAlert);
        }
      },
      error: (error) => console.error('Alert subscription error:', error),
    });

    return subscription;
  },
};

export default amplifyAPI;
