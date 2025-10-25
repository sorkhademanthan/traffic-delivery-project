tuser123= passwrod fpr trafficdb
manthan12345 password for postres

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