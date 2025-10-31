import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
      toast.success('Real-time updates enabled');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      if (reason === 'io server disconnect') {
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        toast.error('Connection lost. Please refresh the page.');
      }
    });

    // Order events
    this.socket.on('order:created', (data) => {
      toast.success(`New order received: ${data.orderNumber}`);
    });

    this.socket.on('order:updated', (data) => {
      toast.info(`Order ${data.orderNumber} updated: ${data.status}`);
    });

    // Driver events
    this.socket.on('driver:statusChanged', (data) => {
      toast.info(`Driver ${data.name} is now ${data.status}`);
    });

    // Route events
    this.socket.on('route:started', (data) => {
      toast.success(`Route ${data.routeNumber} started by ${data.driver.name}`);
    });

    this.socket.on('route:completed', (data) => {
      toast.success(`Route ${data.routeNumber} completed! 🎉`);
    });
  }

  // Subscribe to specific events
  on(event: string, callback: (data: any) => void): void {
    this.socket?.on(event, callback);
  }

  // Unsubscribe from events
  off(event: string): void {
    this.socket?.off(event);
  }

  // Emit events
  emit(event: string, data?: any): void {
    this.socket?.emit(event, data);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const wsService = new WebSocketService();