export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'VIEWER';
  isActive: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  city: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  status: 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  orderValue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: 'BIKE' | 'SCOOTER' | 'CAR' | 'VAN' | 'TRUCK';
  status: 'AVAILABLE' | 'ON_ROUTE' | 'OFF_DUTY' | 'UNAVAILABLE';
  isActive: boolean;
}

export interface Route {
  id: string;
  routeNumber: string;
  driverId: string;
  driver: Driver;
  date: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  totalDistance?: number;
  estimatedDuration?: number;
  stops: RouteStop[];
}

export interface RouteStop {
  id: string;
  routeId: string;
  orderId: string;
  order: Order;
  sequence: number;
  status: 'PENDING' | 'EN_ROUTE' | 'DELIVERED' | 'FAILED';
}