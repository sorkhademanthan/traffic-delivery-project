# SwiftRoute — Chapter 12: Web Admin Portal (React Dashboard)

**Production-Grade React Admin Portal with Advanced Features**

---

## 📋 Table of Contents

1. [Introduction](#introduction)
2. [Tech Stack](#tech-stack)
3. [Project Setup](#project-setup)
4. [Architecture Overview](#architecture-overview)
5. [Implementation Steps](#implementation-steps)
6. [Advanced Features](#advanced-features)
7. [Production Deployment](#production-deployment)
8. [Testing Guide](#testing-guide)

---

## Introduction

### Purpose

Build a professional, production-ready React admin portal for managing the SwiftRoute delivery platform. This dashboard will provide:

- 📊 **Real-time Analytics Dashboard**
- 📦 **Order Management System**
- 👨‍✈️ **Driver Management Interface**
- 🗺️ **Route Visualization & Optimization**
- 🔐 **Authentication & Authorization**
- 📱 **Responsive Design**
- 🎨 **Modern UI/UX**

### Key Features

#### Core Features
- ✅ Login/Logout with JWT
- ✅ Dashboard with real-time statistics
- ✅ Order CRUD operations
- ✅ CSV bulk upload
- ✅ Driver management
- ✅ Route creation & optimization
- ✅ Interactive map visualization

#### Advanced Features
- 🔥 Real-time notifications (WebSocket)
- 🔥 Advanced filtering & search
- 🔥 Data export (CSV, PDF)
- 🔥 Dark mode support
- 🔥 Internationalization (i18n)
- 🔥 Offline support (PWA)
- 🔥 Performance optimization
- 🔥 Accessibility (WCAG 2.1)

---

## Tech Stack

### Core Technologies

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | React | 18.x | UI library |
| **Language** | TypeScript | 5.x | Type safety |
| **Build Tool** | Vite | 5.x | Fast dev server & bundler |
| **Routing** | React Router | 6.x | Navigation |
| **State** | Redux Toolkit | 2.x | Global state management |
| **UI Library** | Material-UI (MUI) | 5.x | Component library |
| **Styling** | Emotion | 11.x | CSS-in-JS |
| **HTTP Client** | Axios | 1.x | API calls |
| **Forms** | React Hook Form | 7.x | Form management |
| **Validation** | Zod | 3.x | Schema validation |
| **Maps** | Leaflet | 4.x | Map visualization |
| **Charts** | Recharts | 2.x | Data visualization |
| **Tables** | TanStack Table | 8.x | Advanced tables |
| **Date** | date-fns | 3.x | Date utilities |

### Development Tools

- **Code Quality**: ESLint, Prettier
- **Testing**: Vitest, React Testing Library, Cypress
- **State Devtools**: Redux DevTools
- **Performance**: Lighthouse, Web Vitals

---

## Project Setup

### Step 1: Initialize React Project

```bash
cd ~/Desktop/projects/traffic-delivery-project

# Create frontend directory
npm create vite@latest frontend -- --template react-ts

cd frontend
```

### Step 2: Install Dependencies

```bash
# Core dependencies
npm install react-router-dom redux @reduxjs/toolkit react-redux
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install axios react-hook-form @hookform/resolvers zod
npm install leaflet react-leaflet recharts
npm install @tanstack/react-table date-fns
npm install jwt-decode

# Development dependencies
npm install -D @types/leaflet @types/node
npm install -D eslint prettier eslint-config-prettier
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### Step 3: Create Environment File

Create `frontend/.env`:

```bash
VITE_API_URL=http://localhost:5001/api
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

### Step 4: Project Structure

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/                    # API client & endpoints
│   │   ├── client.ts           # Axios instance
│   │   ├── auth.api.ts         # Auth endpoints
│   │   ├── orders.api.ts       # Order endpoints
│   │   ├── drivers.api.ts      # Driver endpoints
│   │   └── routes.api.ts       # Route endpoints
│   ├── components/             # Reusable components
│   │   ├── common/             # Common UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Table.tsx
│   │   ├── layout/             # Layout components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MainLayout.tsx
│   │   └── maps/               # Map components
│   │       ├── RouteMap.tsx
│   │       └── OrderMap.tsx
│   ├── features/               # Feature modules
│   │   ├── auth/               # Authentication
│   │   │   ├── Login.tsx
│   │   │   ├── authSlice.ts
│   │   │   └── ProtectedRoute.tsx
│   │   ├── dashboard/          # Dashboard
│   │   │   ├── Dashboard.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   └── RecentActivity.tsx
│   │   ├── orders/             # Order management
│   │   │   ├── OrderList.tsx
│   │   │   ├── OrderForm.tsx
│   │   │   ├── OrderDetails.tsx
│   │   │   ├── CSVUpload.tsx
│   │   │   └── ordersSlice.ts
│   │   ├── drivers/            # Driver management
│   │   │   ├── DriverList.tsx
│   │   │   ├── DriverForm.tsx
│   │   │   ├── DriverDetails.tsx
│   │   │   └── driversSlice.ts
│   │   └── routes/             # Route management
│   │       ├── RouteList.tsx
│   │       ├── RouteForm.tsx
│   │       ├── RouteDetails.tsx
│   │       ├── RouteOptimizer.tsx
│   │       └── routesSlice.ts
│   ├── hooks/                  # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useDebounce.ts
│   │   └── useNotification.ts
│   ├── store/                  # Redux store
│   │   ├── store.ts
│   │   └── hooks.ts
│   ├── types/                  # TypeScript types
│   │   ├── api.types.ts
│   │   ├── order.types.ts
│   │   ├── driver.types.ts
│   │   └── route.types.ts
│   ├── utils/                  # Utility functions
│   │   ├── format.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   ├── App.tsx                 # Main App component
│   ├── main.tsx               # Entry point
│   └── theme.ts               # MUI theme config
├── .env
├── .env.example
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Architecture Overview

### State Management Architecture

```
┌─────────────────────────────────────────┐
│          Redux Store (Global)           │
│  ┌─────────────────────────────────┐   │
│  │  Auth Slice (user, token)       │   │
│  │  Orders Slice (orders, filters) │   │
│  │  Drivers Slice (drivers, stats) │   │
│  │  Routes Slice (routes, map)     │   │
│  │  UI Slice (theme, notifications)│   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
           ↓                  ↑
    Components read        Components dispatch
       state                  actions
```

### Component Hierarchy

```
App
├── Router
│   ├── Login (public)
│   └── MainLayout (protected)
│       ├── Navbar
│       ├── Sidebar
│       └── Routes
│           ├── Dashboard
│           ├── Orders
│           │   ├── OrderList
│           │   ├── OrderForm
│           │   └── OrderDetails
│           ├── Drivers
│           │   ├── DriverList
│           │   ├── DriverForm
│           │   └── DriverDetails
│           └── Routes
│               ├── RouteList
│               ├── RouteForm
│               └── RouteOptimizer
```

---

## Implementation Steps

### Step 1: Setup API Client

Create `src/api/client.ts`:

```typescript
// filepath: frontend/src/api/client.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

### Step 2: Create TypeScript Types

Create `src/types/api.types.ts`:

```typescript
// filepath: frontend/src/types/api.types.ts
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
```

---

### Step 3: Create Redux Store

Create `src/store/store.ts`:

```typescript
// filepath: frontend/src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import ordersReducer from '../features/orders/ordersSlice';
import driversReducer from '../features/drivers/driversSlice';
import routesReducer from '../features/routes/routesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: ordersReducer,
    drivers: driversReducer,
    routes: routesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

Create `src/store/hooks.ts`:

```typescript
// filepath: frontend/src/store/hooks.ts
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

---

### Step 4: Create Auth API

Create `src/api/auth.api.ts`:

```typescript
// filepath: frontend/src/api/auth.api.ts
import apiClient from './client';
import { LoginRequest, LoginResponse } from '../types/api.types';

export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('token');
  },
};
```

---

### Step 5: Create Auth Slice

Create `src/features/auth/authSlice.ts`:

```typescript
// filepath: frontend/src/features/auth/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authAPI } from '../../api/auth.api';
import { LoginRequest, LoginResponse, User } from '../../types/api.types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      localStorage.setItem('token', response.token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authAPI.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
```

---

### Step 6: Create Login Component

Create `src/features/auth/Login.tsx`:

```typescript
// filepath: frontend/src/features/auth/Login.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login } from './authSlice';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.auth);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    const result = await dispatch(login(data));
    if (login.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
      <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom textAlign="center">
            SwiftRoute Admin
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
            Sign in to your account
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              {...register('email')}
              label="Email"
              fullWidth
              margin="normal"
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              {...register('password')}
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 3 }} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </form>

          <Typography variant="caption" color="text.secondary" display="block" mt={2} textAlign="center">
            Default: admin@swiftroute.com / admin123
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
```

---

### Step 7: Create Dashboard

Create `src/features/dashboard/Dashboard.tsx`:

```typescript
// filepath: frontend/src/features/dashboard/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { LocalShipping, Assignment, People, TrendingUp } from '@mui/icons-material';
import apiClient from '../../api/client';

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  totalDrivers: number;
  availableDrivers: number;
  totalRoutes: number;
  activeRoutes: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [orders, drivers, routes] = await Promise.all([
          apiClient.get('/orders/stats'),
          apiClient.get('/drivers/stats'),
          apiClient.get('/routes/stats'),
        ]);

        setStats({
          totalOrders: orders.data.stats.total,
          pendingOrders: orders.data.stats.pending,
          totalDrivers: drivers.data.stats.total,
          availableDrivers: drivers.data.stats.available,
          totalRoutes: routes.data.stats.total,
          activeRoutes: routes.data.stats.inProgress,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary">Total Orders</Typography>
                  <Typography variant="h4">{stats?.totalOrders || 0}</Typography>
                  <Typography variant="caption">{stats?.pendingOrders || 0} pending</Typography>
                </Box>
                <Assignment color="primary" sx={{ fontSize: 48 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary">Drivers</Typography>
                  <Typography variant="h4">{stats?.totalDrivers || 0}</Typography>
                  <Typography variant="caption" color="success.main">{stats?.availableDrivers || 0} available</Typography>
                </Box>
                <People color="primary" sx={{ fontSize: 48 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary">Routes</Typography>
                  <Typography variant="h4">{stats?.totalRoutes || 0}</Typography>
                  <Typography variant="caption" color="warning.main">{stats?.activeRoutes || 0} active</Typography>
                </Box>
                <LocalShipping color="primary" sx={{ fontSize: 48 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary">Efficiency</Typography>
                  <Typography variant="h4">92%</Typography>
                  <Typography variant="caption" color="success.main">+5% from last week</Typography>
                </Box>
                <TrendingUp color="primary" sx={{ fontSize: 48 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
```

---

### Step 8: Create Main App

Create `src/App.tsx`:

```typescript
// filepath: frontend/src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { store } from './store/store';
import theme from './theme';
import Login from './features/auth/Login';
import Dashboard from './features/dashboard/Dashboard';
import { useAppSelector } from './store/hooks';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
```

Create `src/theme.ts`:

```typescript
// filepath: frontend/src/theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

export default theme;
```

---

## Run the Frontend

```bash
cd ~/Desktop/projects/traffic-delivery-project/frontend
npm run dev
```

Open http://localhost:5173 in your browser!

---

## Next Steps

✅ **Chapter 12 Complete**: Basic React Admin Portal  
🔜 **Chapter 13**: Advanced Features (Maps, CSV Upload, Real-time)  
🔜 **Chapter 14**: Mobile Driver App  
🔜 **Chapter 15**: Production Deployment  

---

**Your web admin portal is ready to build!** 🚀
