import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(userId: string, userType: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    console.log('Connecting to WebSocket server:', SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      
      // Join user-specific room
      this.socket?.emit('join', { userId, userType });
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      // Rejoin rooms after reconnection
      this.socket?.emit('join', { userId, userType });
    });

    return this.socket;
  }

  joinFamily(familyCode: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join-family', { familyCode });
      console.log('Joined family room:', familyCode);
    }
  }

  onLocationUpdate(callback: (data: LocationUpdate) => void): void {
    this.socket?.on('location-update', callback);
  }

  onAlertReceived(callback: (data: Alert) => void): void {
    this.socket?.on('alert-received', callback);
  }

  offLocationUpdate(callback?: (data: LocationUpdate) => void): void {
    if (callback) {
      this.socket?.off('location-update', callback);
    } else {
      this.socket?.off('location-update');
    }
  }

  offAlertReceived(callback?: (data: Alert) => void): void {
    if (callback) {
      this.socket?.off('alert-received', callback);
    } else {
      this.socket?.off('alert-received');
    }
  }

  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting WebSocket');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export interface LocationUpdate {
  childId: string;
  childName: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

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

export const socketService = new SocketService();
export default socketService;
