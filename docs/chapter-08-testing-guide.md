# SwiftRoute — Chapter 8: Testing Guide (Step-by-Step)

Purpose: Easy-to-follow testing instructions for Order Management API

---

## Prerequisites Checklist

Before testing, verify these are complete:

```bash
# 1. Check if backend server is running
cd ~/Desktop/projects/traffic-delivery-project/backend
npm run dev

# You should see:
# 🚀 SwiftRoute Backend API running on port 5001
# ✅ Database connected successfully

# 2. Check if database has seed data
# Open a new terminal and run:
psql -U tuser -h localhost -d trafficdb -c "SELECT * FROM users LIMIT 1;"

# Should show admin user

# 3. Verify routes are registered
# Look in your server console - you should NOT see any route errors
```

---

## Option 1: Using Postman (Recommended - Visual & Easy)

### Step 1: Install Postman

Download from: https://www.postman.com/downloads/

### Step 2: Create a New Collection

1. Open Postman
2. Click **"New"** → **"Collection"**
3. Name it: **"SwiftRoute API"**

### Step 3: Set Up Environment Variables

1. Click the eye icon (👁️) in top right
2. Click **"Add"** to create a new environment
3. Name it: **"SwiftRoute Local"**
4. Add these variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `baseUrl` | `http://localhost:5001` | `http://localhost:5001` |
| `token` | (leave empty) | (leave empty) |

5. Click **"Save"**
6. Select **"SwiftRoute Local"** from the environment dropdown

---

## Step-by-Step API Testing

### Test 1: Health Check (No Auth Required)

**Purpose:** Verify server is running

1. Create new request: **GET** `{{baseUrl}}/api/health`
2. Click **"Send"**
3. ✅ Expected Response (200 OK):
```json
{
  "status": "ok",
  "message": "SwiftRoute API is running",
  "timestamp": "2024-01-25T12:00:00.000Z"
}
```

---

### Test 2: Login & Get Token

**Purpose:** Authenticate and save token for future requests

1. Create new request: **POST** `{{baseUrl}}/api/auth/login`
2. Go to **"Body"** tab → Select **"raw"** → Select **"JSON"**
3. Enter:
```json
{
  "email": "admin@swiftroute.com",
  "password": "admin123"
}
```
4. Click **"Send"**
5. ✅ Expected Response (200 OK):
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@swiftroute.com",
    "name": "Admin User",
    "role": "ADMIN"
  }
}
```

6. **IMPORTANT:** Copy the `token` value
7. Go to your environment (👁️ icon)
8. Click **"SwiftRoute Local"**
9. Paste the token into the `token` variable **"Current Value"** field
10. Click **"Save"**

---

### Test 3: Create First Order

**Purpose:** Add a single order

1. Create new request: **POST** `{{baseUrl}}/api/orders`
2. Go to **"Authorization"** tab:
   - Type: **"Bearer Token"**
   - Token: `{{token}}`
3. Go to **"Body"** tab → **"raw"** → **"JSON"**
4. Enter:
```json
{
  "orderNumber": "ORD-001",
  "customerName": "John Doe",
  "customerPhone": "+1234567890",
  "customerEmail": "john@example.com",
  "address": "123 Main Street",
  "city": "New York",
  "postalCode": "10001",
  "priority": "NORMAL",
  "deliveryNotes": "Leave at door"
}
```
5. Click **"Send"**
6. ✅ Expected Response (201 Created):
```json
{
  "message": "Order created successfully",
  "order": {
    "id": "...",
    "orderNumber": "ORD-001",
    "customerName": "John Doe",
    ...
  }
}
```

---

### Test 4: Get All Orders

**Purpose:** List all orders with pagination

1. Create new request: **GET** `{{baseUrl}}/api/orders?page=1&limit=10`
2. Authorization: **Bearer Token** → `{{token}}`
3. Click **"Send"**
4. ✅ Expected Response (200 OK):
```json
{
  "orders": [
    {
      "id": "...",
      "orderNumber": "ORD-001",
      "customerName": "John Doe",
      ...
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### Test 5: Get Order Statistics

**Purpose:** Dashboard metrics

1. Create new request: **GET** `{{baseUrl}}/api/orders/stats`
2. Authorization: **Bearer Token** → `{{token}}`
3. Click **"Send"**
4. ✅ Expected Response (200 OK):
```json
{
  "stats": {
    "total": 3,
    "pending": 3,
    "assigned": 0,
    "inTransit": 0,
    "delivered": 0,
    "failed": 0,
    "today": 3
  }
}
```

---

### Test 6: Search Orders

**Purpose:** Test search functionality

1. Create new request: **GET** `{{baseUrl}}/api/orders?search=John&page=1&limit=10`
2. Authorization: **Bearer Token** → `{{token}}`
3. Click **"Send"**
4. ✅ Should return orders matching "John"

---

### Test 7: Filter by Status

**Purpose:** Test filtering

1. Create new request: **GET** `{{baseUrl}}/api/orders?status=PENDING&page=1&limit=10`
2. Authorization: **Bearer Token** → `{{token}}`
3. Click **"Send"**
4. ✅ Should return only PENDING orders

---

## Option 2: Using cURL (Terminal)

### Step 1: Login and Save Token

```bash
# Login and get token
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@swiftroute.com","password":"admin123"}' \
  | jq -r '.token'

# Copy the token output and save it:
export TOKEN="paste-your-token-here"
```

### Step 2: Create Order

```bash
curl -X POST http://localhost:5001/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "ORD-002",
    "customerName": "Jane Smith",
    "customerPhone": "+1234567891",
    "address": "456 Oak Avenue",
    "city": "Brooklyn",
    "postalCode": "11201",
    "priority": "HIGH"
  }'
```

### Step 3: Get All Orders

```bash
curl -X GET "http://localhost:5001/api/orders?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### Step 4: Get Order Stats

```bash
curl -X GET http://localhost:5001/api/orders/stats \
  -H "Authorization: Bearer $TOKEN"
```

---

## Troubleshooting

### Error: "Route not found"

**Cause:** Server routes not registered properly

**Solution:**
```bash
# 1. Stop the server (Ctrl+C)

# 2. Check if orderRoutes.ts exists
ls -la src/routes/orderRoutes.ts

# 3. Check if server.ts imports orderRoutes
cat src/server.ts | grep orderRoutes

# 4. If missing, add to server.ts:
# import orderRoutes from './routes/orderRoutes';
# app.use('/api/orders', orderRoutes);

# 5. Restart server
npm run dev
```

---

### Error: "Access token required" or 401

**Cause:** Missing or expired token

**Solution:**
1. Login again to get a fresh token
2. Make sure you're passing: `Authorization: Bearer YOUR_TOKEN`
3. Check token is saved in Postman environment

---

### Error: "Failed to connect"

**Cause:** Server not running

**Solution:**
```bash
# Start the server
cd ~/Desktop/projects/traffic-delivery-project/backend
npm run dev
```

---

### Error: "Database connection failed"

**Cause:** PostgreSQL not running

**Solution:**
```bash
# Check if PostgreSQL is running
psql -U tuser -h localhost -d trafficdb -c "SELECT 1;"

# If fails, start PostgreSQL
brew services start postgresql@14
```

---

## Quick Test Script

Save this as `test-api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:5001"

echo "🧪 Testing SwiftRoute API..."
echo ""

# 1. Health Check
echo "1️⃣ Testing health check..."
curl -s $BASE_URL/api/health | jq
echo ""

# 2. Login
echo "2️⃣ Logging in..."
TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@swiftroute.com","password":"admin123"}' \
  | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ Login failed"
  exit 1
fi

echo "✅ Token received: ${TOKEN:0:20}..."
echo ""

# 3. Get Orders
echo "3️⃣ Getting orders..."
curl -s -X GET "$BASE_URL/api/orders?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq
echo ""

# 4. Get Stats
echo "4️⃣ Getting order stats..."
curl -s -X GET "$BASE_URL/api/orders/stats" \
  -H "Authorization: Bearer $TOKEN" | jq
echo ""

echo "✅ All tests completed!"
```

Make it executable and run:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## Complete Postman Collection (Import This)

Save this as `swiftroute-postman-collection.json`:

```json
{
  "info": {
    "name": "SwiftRoute API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"admin@swiftroute.com\",\n  \"password\": \"admin123\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{baseUrl}}/api/auth/login",
              "host": ["{{baseUrl}}"],
              "path": ["api", "auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "Orders",
      "item": [
        {
          "name": "Create Order",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"orderNumber\": \"ORD-001\",\n  \"customerName\": \"John Doe\",\n  \"customerPhone\": \"+1234567890\",\n  \"address\": \"123 Main St\",\n  \"city\": \"New York\",\n  \"postalCode\": \"10001\",\n  \"priority\": \"NORMAL\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{baseUrl}}/api/orders",
              "host": ["{{baseUrl}}"],
              "path": ["api", "orders"]
            },
            "auth": {
              "type": "bearer",
              "bearer": [{"key": "token", "value": "{{token}}", "type": "string"}]
            }
          }
        },
        {
          "name": "Get All Orders",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/api/orders?page=1&limit=10",
              "host": ["{{baseUrl}}"],
              "path": ["api", "orders"],
              "query": [
                {"key": "page", "value": "1"},
                {"key": "limit", "value": "10"}
              ]
            },
            "auth": {
              "type": "bearer",
              "bearer": [{"key": "token", "value": "{{token}}", "type": "string"}]
            }
          }
        },
        {
          "name": "Get Order Stats",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/api/orders/stats",
              "host": ["{{baseUrl}}"],
              "path": ["api", "orders", "stats"]
            },
            "auth": {
              "type": "bearer",
              "bearer": [{"key": "token", "value": "{{token}}", "type": "string"}]
            }
          }
        }
      ]
    }
  ]
}
```

Import this into Postman: **Import** → **Upload Files** → Select the JSON file

---

## Summary Checklist

Before moving to Chapter 9, verify:

- [ ] Server starts without errors
- [ ] Can login and get JWT token
- [ ] Can create a new order
- [ ] Can get list of orders
- [ ] Can view order statistics
- [ ] Can search and filter orders
- [ ] All CRUD operations work (Create, Read, Update, Delete)

---

**Once all tests pass, you're ready for Chapter 9: Driver Management!** 🚀
