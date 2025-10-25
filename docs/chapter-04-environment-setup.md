# SwiftRoute — Chapter 4: Environment Setup & Installation Guide

Purpose: Set up the complete development environment for backend API, admin web portal, and mobile app development.

---

## Development Phases

**Phase 1 (Current)**: Backend API + Web Admin Portal  
**Phase 2 (Later)**: Mobile Driver App (iOS & Android)

This guide focuses on **Phase 1** setup. Mobile development tools will be covered when we're ready to build the driver app.

---

## Prerequisites

Before starting, ensure you have:
- A macOS, Windows, or Linux machine
- Administrator/sudo access for installations
- Stable internet connection
- GitHub account (for version control)

---

## 1. Core Development Tools

### 1.1 Node.js & npm (v18 LTS or higher)

**Why**: Backend API (Express.js) and frontend build tools

**Installation**:
```bash
# macOS (using Homebrew)
brew install node@18

# Windows (using official installer)
# Download from: https://nodejs.org/

# Linux (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

### 1.2 Git

**Why**: Version control for collaborative development

**Installation**:
```bash
# macOS
brew install git

# Windows
# Download from: https://git-scm.com/download/win

# Linux
sudo apt-get install git

# Verify
git --version
```

### 1.3 Code Editor - VS Code (Recommended)

**Why**: Excellent TypeScript/JavaScript support, extensions, debugging

**Installation**:
- Download from: https://code.visualstudio.com/
- Install recommended extensions:
  - ESLint
  - Prettier
  - REST Client
  - Docker
  - React Native Tools (for mobile)

---

## 2. Backend Development Setup

### 2.1 PostgreSQL Database (v14 or higher)

**Why**: Primary database for orders, routes, drivers, audit logs

**Installation**:
```bash
# macOS
brew install postgresql@14
brew services start postgresql@14

# Windows
# Download installer from: https://www.postgresql.org/download/windows/
# Use PostgreSQL installer with pgAdmin 4

# Linux
sudo apt-get install postgresql-14 postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify
psql --version

# Create development database
psql postgres
CREATE DATABASE swiftroute_dev;
CREATE USER swiftroute_user WITH PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE swiftroute_dev TO swiftroute_user;
\q
```

### 2.2 Redis (for sessions, caching, real-time)

**Why**: Session management, pub/sub for live location tracking

**Installation**:
```bash
# macOS
brew install redis
brew services start redis

# Windows
# Use WSL2 or Docker (recommended)
docker run -d -p 6379:6379 --name redis redis:7-alpine

# Linux
sudo apt-get install redis-server
sudo systemctl start redis-server

# Verify
redis-cli ping  # Should return PONG
```

### 2.3 Docker & Docker Compose (Optional but Recommended)

**Why**: Containerize services for consistent environments

**Installation**:
```bash
# macOS/Windows
# Download Docker Desktop from: https://www.docker.com/products/docker-desktop/

# Linux
sudo apt-get install docker.io docker-compose
sudo systemctl start docker
sudo usermod -aG docker $USER  # Add yourself to docker group

# Verify
docker --version
docker-compose --version
```

---

## 3. Frontend Web (Admin Portal) Setup

### 3.1 React Development Tools

**Why**: Modern admin dashboard with TypeScript

**Installation**:
```bash
# Install Create React App globally (optional)
npm install -g create-react-app

# Or use npx (recommended - always uses latest)
npx create-react-app --version
```

### 3.2 Browser Extensions

**Install in Chrome/Edge**:
- React Developer Tools
- Redux DevTools (if we use Redux)
- Lighthouse (performance auditing)

---

## 4. Mobile App Development Setup

> **📱 PHASE 2 - SKIP FOR NOW**  
> Mobile development setup (React Native, Xcode, Android Studio) will be covered later when we build the driver app.  
> For now, focus on backend and web admin to validate core functionality.

### Why Skip Mobile Initially?

1. **Faster validation**: Get the core routing and admin features working first
2. **API-first approach**: Build and test the backend API thoroughly before mobile clients
3. **Reduced complexity**: Avoid managing iOS/Android build tools during early development
4. **Iterative development**: Test with web admin, then extend to mobile with confidence

### When to Set Up Mobile Tools

You'll set up React Native, Xcode, and Android Studio when:
- Backend API is stable and tested
- Web admin portal is functional
- You're ready to build the driver mobile app
- We reach Chapter 15+ (Mobile App Development)

### Quick Mobile Testing Alternative (Optional)

For early testing without full mobile setup:
- Use **responsive web design** in the admin portal
- Test driver workflow in mobile browser (Chrome DevTools device mode)
- Create a simple mobile-optimized web view for drivers initially

---

## 5. API & Testing Tools

### 5.1 Postman or Insomnia

**Why**: API endpoint testing and documentation

**Installation**:
- Postman: https://www.postman.com/downloads/
- Insomnia: https://insomnia.rest/download

### 5.2 Database GUI Tools

**pgAdmin 4** (usually bundled with PostgreSQL)
- Or use **TablePlus** (macOS): https://tableplus.com/
- Or **DBeaver** (cross-platform): https://dbeaver.io/

---

## 6. Third-Party Service Accounts (Setup Later)

You'll need to create accounts for:

### 6.1 Google Cloud Platform
- **Google Maps API** (geocoding, routing, map display)
- Create project at: https://console.cloud.google.com/
- Enable: Maps JavaScript API, Geocoding API, Directions API, Distance Matrix API

### 6.2 SendGrid or Mailgun (Email Notifications)
- For delivery confirmations, alerts
- Free tier available at: https://sendgrid.com/ or https://www.mailgun.com/

### 6.3 Twilio (Optional - SMS Notifications)
- For SMS delivery updates
- Free trial at: https://www.twilio.com/

### 6.4 AWS S3 or Cloudinary (Image Storage)
- For proof of delivery photos
- Free tier at: https://aws.amazon.com/ or https://cloudinary.com/

**Note**: We'll configure API keys in Chapter 5 (Project Initialization).

---

## 7. Verification Checklist

Run these commands to verify your **Phase 1** setup:

```bash
# Core tools
node --version        # v18.x.x
npm --version         # 9.x.x
git --version         # 2.x.x

# Backend
psql --version        # 14.x
redis-cli ping        # PONG
docker --version      # 20.x.x (optional)

# Frontend Web
# (No specific command - verified when we create React app in Chapter 5)
```

**✅ Phase 1 Complete Checklist:**
- [ ] Node.js v18+ installed
- [ ] PostgreSQL running and database created
- [ ] Redis running
- [ ] Git configured
- [ ] VS Code installed with extensions
- [ ] Postman or Insomnia installed

**⏳ Phase 2 (Deferred):**
- [ ] ~~Xcode & CocoaPods~~ (later)
- [ ] ~~Android Studio & SDK~~ (later)
- [ ] ~~React Native CLI~~ (later)

---

## 8. Project Repository Setup

### 8.1 Create GitHub Repository

```bash
# On GitHub.com, create a new private repository: swiftroute

# Clone locally
cd ~/Desktop/projects/
git clone https://github.com/yourusername/swiftroute.git traffic-delivery-project

cd traffic-delivery-project
```

### 8.2 Initialize Project Structure

We'll do this in **Chapter 5**, but here's a preview:

```
traffic-delivery-project/
├── backend/           # Node.js API (Express + TypeScript) - PHASE 1
├── web-admin/         # React admin portal - PHASE 1
├── mobile-driver/     # React Native driver app - PHASE 2 (LATER)
├── docs/              # Documentation (current folder)
├── docker-compose.yml # Local dev environment
└── README.md
```

---

## Next Steps

✅ **Chapter 4 Complete**: Phase 1 development environment ready  
🔜 **Chapter 5**: Project initialization (backend + web admin scaffolding)  
🔜 **Chapter 6**: Database schema design & migrations  
🔜 **Chapter 7**: Backend API development starts  
🔜 **Chapter 8-14**: Web admin portal features  
⏳ **Chapter 15+**: Mobile app development (Phase 2)

---

## Troubleshooting

### Common Issues:

**PostgreSQL connection refused**:
```bash
# Check if running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Start manually
pg_ctl -D /usr/local/var/postgres start  # macOS
```

**Redis not connecting**:
```bash
# Check if running
redis-cli ping

# Start manually
redis-server
```

**React Native build errors**:
```bash
# ⏸️ SKIP - Not needed in Phase 1
# We'll cover mobile troubleshooting in Phase 2
```

**Port already in use (e.g., 3000, 5000)**:
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3000   # Windows (then kill PID)
```

---

**Ready to proceed?** Once Phase 1 installations are complete, move to Chapter 5 for backend and web project scaffolding! 🚀

**No mobile tools needed yet** - we'll build a solid foundation first, then extend to mobile when the core platform is working. 📱✨
sudo systemctl status postgresql  # Linux

# Start manually
pg_ctl -D /usr/local/var/postgres start  # macOS
```

**Redis not connecting**:
```bash
# Check if running
redis-cli ping

# Start manually
redis-server
```

**React Native build errors**:
```bash
# iOS: Clean build folder
cd ios && pod install && cd ..
npx react-native run-ios --reset-cache

# Android: Clean gradle
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

**Port already in use (e.g., 3000, 5000)**:
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3000   # Windows (then kill PID)
```

---

**Ready to proceed?** Once installations are complete, move to Chapter 5 for project scaffolding! 🚀
