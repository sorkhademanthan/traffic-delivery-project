# SwiftRoute — Chapter 5: Project Initialization & Scaffolding

Purpose: Set up the foundational project structure for backend API and web admin portal.

---

## Phase 1 Focus

✅ Backend API (Node.js + Express + TypeScript)  
✅ Web Admin Portal (React + TypeScript)  
⏸️ Mobile Driver App (Phase 2 - Later)

---

## Project Structure Overview

```
traffic-delivery-project/
├── backend/              # Backend API
│   ├── src/
│   │   ├── config/       # Configuration (database, redis, etc.)
│   │   ├── controllers/  # Route handlers
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth, validation, error handling
│   │   ├── utils/        # Helper functions
│   │   └── server.ts     # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── web-admin/            # React Admin Portal
│   ├── public/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client
│   │   ├── hooks/        # Custom React hooks
│   │   ├── utils/        # Helper functions
│   │   ├── types/        # TypeScript types
│   │   └── App.tsx       # Root component
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                 # Documentation (existing)
├── docker-compose.yml    # Local dev environment
├── .gitignore
└── README.md
```

---

## Step 1: Initialize Backend Project

### 1.1 Create Backend Directory & Initialize npm

```bash
# Navigate to project root
cd ~/Desktop/projects/traffic-delivery-project

# Create backend directory
mkdir backend
cd backend

# Initialize npm project
npm init -y

# This creates package.json
```

### 1.2 Install Backend Dependencies

```bash
# Core dependencies
npm install express cors dotenv
npm install pg redis ioredis
npm install bcryptjs jsonwebtoken
npm install express-validator
npm install morgan helmet compression

# TypeScript and types
npm install --save-dev typescript @types/node @types/express
npm install --save-dev @types/cors @types/bcryptjs @types/jsonwebtoken
npm install --save-dev @types/morgan

# Development tools
npm install --save-dev nodemon ts-node
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev prettier eslint-config-prettier

# Database tools (we'll use these later)
npm install --save-dev prisma @prisma/client
```

### 1.3 Create TypeScript Configuration

```bash
# Create tsconfig.json
npx tsc --init
```

Then update the generated `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 1.4 Create Backend Source Structure

```bash
# Create directory structure
mkdir -p src/{config,controllers,models,routes,services,middleware,utils}

# Create entry point
touch src/server.ts
```

### 1.5 Update package.json Scripts

Edit `backend/package.json` and add these scripts:

```json
{
  "name": "swiftroute-backend",
  "version": "1.0.0",
  "description": "SwiftRoute Backend API",
  "main": "dist/server.js",
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write \"src/**/*.ts\""
  },
  "keywords": ["delivery", "routing", "api"],
  "author": "Your Name",
  "license": "MIT"
}
```

### 1.6 Create Basic Server File

Create `backend/src/server.ts`:

```typescript
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(compression()); // Compress responses
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'SwiftRoute API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes will go here
// app.use('/api/orders', orderRoutes);
// app.use('/api/drivers', driverRoutes);
// app.use('/api/routes', routeRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SwiftRoute Backend API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});
```

### 1.7 Create Environment Configuration

Create `backend/.env.example`:

```bash
# Server
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://swiftroute_user:dev_password@localhost:5432/swiftroute_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Google Maps API (get this later)
GOOGLE_MAPS_API_KEY=

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

Then create actual `.env` file:

```bash
cp .env.example .env
```

### 1.8 Create nodemon Configuration

Create `backend/nodemon.json`:

```json
{
  "watch": ["src"],
  "ext": "ts",
  "exec": "ts-node src/server.ts"
}
```

### 1.9 Test Backend Server

```bash
# From backend directory
npm run dev

# You should see:
# 🚀 SwiftRoute Backend API running on port 5000
# 📍 Health check: http://localhost:5000/api/health

# Test in another terminal:
curl http://localhost:5000/api/health
```

---

## Step 2: Initialize Web Admin Project

### 2.1 Create React App with TypeScript

```bash
# Navigate back to project root
cd ~/Desktop/projects/traffic-delivery-project

# Create React app with TypeScript template
npx create-react-app web-admin --template typescript

cd web-admin
```

### 2.2 Install Web Admin Dependencies

```bash
# UI Framework and components
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled

# Routing
npm install react-router-dom

# State management (optional - we'll use Context API initially)
# npm install zustand  # Lightweight alternative to Redux

# API client
npm install axios

# Map integration
npm install @react-google-maps/api

# Form handling
npm install react-hook-form

# Date/time utilities
npm install date-fns

# Charts (for analytics)
npm install recharts

# Type definitions
npm install --save-dev @types/react-router-dom
```

### 2.3 Update Web Admin Structure

```bash
# Create additional directories
cd src
mkdir -p components/{common,layout,orders,drivers,routes}
mkdir -p pages
mkdir -p services
mkdir -p hooks
mkdir -p utils
mkdir -p types
mkdir -p contexts
```

### 2.4 Create Basic API Service

Create `web-admin/src/services/api.ts`:

```typescript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (add auth token)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (handle errors)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// Example API methods
export const healthCheck = () => apiClient.get('/health');

// We'll add more methods as we build features:
// export const getOrders = () => apiClient.get('/orders');
// export const createOrder = (data) => apiClient.post('/orders', data);
```

### 2.5 Create Environment Configuration

Create `web-admin/.env.example`:

```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_MAPS_API_KEY=
```

Then create actual `.env`:

```bash
cp .env.example .env
```

### 2.6 Update App.tsx (Basic Structure)

Edit `web-admin/src/App.tsx`:

```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// We'll create these components in later chapters
// import Dashboard from './pages/Dashboard';
// import Orders from './pages/Orders';
// import Drivers from './pages/Drivers';
// import Routes from './pages/Routes';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <h1>SwiftRoute Admin Portal</h1>
          <p>Environment: {process.env.NODE_ENV}</p>
          <p>API URL: {process.env.REACT_APP_API_URL}</p>
          {/* Routes will go here */}
          <Routes>
            <Route path="/" element={<div>Dashboard Coming Soon...</div>} />
            <Route path="/orders" element={<div>Orders Coming Soon...</div>} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
```

### 2.7 Test Web Admin

```bash
# From web-admin directory
npm start

# Browser should open at http://localhost:3000
# You should see "SwiftRoute Admin Portal"
```

---

## Step 3: Create Docker Compose (Optional)

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: swiftroute_postgres
    environment:
      POSTGRES_USER: swiftroute_user
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: swiftroute_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: swiftroute_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Using Docker Compose:

```bash
# Start services
docker-compose up -d

# Check status
docker-compose ps

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

---

## Step 4: Create Project-Wide Files

### 4.1 Root README.md

Create `README.md` in project root:

```markdown
# SwiftRoute - Delivery Route Optimization Platform

A comprehensive delivery route optimization system for bakeries and small delivery businesses.

## Project Structure

- `backend/` - Node.js/Express API with TypeScript
- `web-admin/` - React admin portal for route management
- `mobile-driver/` - (Phase 2) React Native driver app
- `docs/` - Project documentation

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Web Admin Setup
```bash
cd web-admin
npm install
cp .env.example .env
npm start
```

### Using Docker
```bash
docker-compose up -d
```

## Development Status

✅ Phase 1: Backend API + Web Admin (In Progress)  
⏸️ Phase 2: Mobile Driver App (Coming Later)

## Documentation

See `docs/` folder for detailed documentation:
- Chapter 1: User Stories
- Chapter 2: System Architecture
- Chapter 3: Technical Specification
- Chapter 4: Environment Setup
- Chapter 5: Project Initialization (Current)
```

### 4.2 Root .gitignore

Create `.gitignore` in project root:

```
# Dependencies
node_modules/
*/node_modules/

# Environment variables
.env
.env.local
.env.*.local

# Build outputs
dist/
build/
*/dist/
*/build/

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Database
*.sqlite
*.db

# Docker
docker-compose.override.yml
```

---

## Step 5: Verification & Testing

### 5.1 Test Backend

```bash
cd backend
npm run dev

# In another terminal:
curl http://localhost:5000/api/health

# Expected response:
# {
#   "status": "ok",
#   "message": "SwiftRoute API is running",
#   "timestamp": "2024-01-15T10:30:00.000Z"
# }
```

### 5.2 Test Web Admin

```bash
cd web-admin
npm start

# Browser opens at http://localhost:3000
# Should see "SwiftRoute Admin Portal"
```

### 5.3 Test Database Connection (PostgreSQL)

```bash
# Connect to database
psql -h localhost -U swiftroute_user -d swiftroute_dev

# Inside psql:
\dt  # List tables (should be empty for now)
\q   # Quit
```

### 5.4 Test Redis

```bash
redis-cli ping
# Should return: PONG
```

---

## Completion Checklist

✅ **Backend Initialized:**
- [ ] `backend/` directory created
- [ ] Dependencies installed
- [ ] TypeScript configured
- [ ] Basic Express server running
- [ ] Health check endpoint working
- [ ] `.env` file configured

✅ **Web Admin Initialized:**
- [ ] `web-admin/` directory created  
- [ ] React app with TypeScript created
- [ ] Dependencies installed
- [ ] Basic routing setup
- [ ] API service configured
- [ ] `.env` file configured

✅ **Project Configuration:**
- [ ] `docker-compose.yml` created (optional)
- [ ] Root `README.md` created
- [ ] Root `.gitignore` created
- [ ] PostgreSQL database created
- [ ] Redis running

---

## Next Steps

✅ **Chapter 5 Complete**: Project structure initialized  
🔜 **Chapter 6**: Database schema design with Prisma  
🔜 **Chapter 7**: Authentication & user management  
🔜 **Chapter 8**: Order management API  
🔜 **Chapter 9**: Route optimization service

---

## Common Issues & Solutions

### Port already in use:
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database connection error:
```bash
# Check if PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Restart PostgreSQL
brew services restart postgresql@14  # macOS
```

### TypeScript errors in backend:
```bash
cd backend
npm run lint
npm run format
```

---

**Ready for Chapter 6?** We'll design the database schema and set up Prisma ORM! 🗄️
