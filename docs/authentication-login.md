# SwiftRoute — Authentication & Login Credentials

Purpose: Store login credentials and tokens for testing

---

## Admin User Credentials

**Email:** `admin@swiftroute.com`  
**Password:** `admin123`

---

## Current Active Token

**Token (Latest):**
```

---

## Test Results

### ✅ Test 1: Order Creation (January 25, 2025)

**Request:**
```bash
curl -X POST http://localhost:5001/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "ORD-TEST-001",
    "customerName": "Test Customer",
    "customerPhone": "+1234567890",
    "address": "123 Test St",
    "city": "Test City",
    "postalCode": "12345",
    "priority": "NORMAL"
  }'
```

**Response:**
```json
{
  "message": "Order created successfully",
  "order": {
    "id": "cmh6musna0000xfg13wnjofqc",
    "orderNumber": "ORD-TEST-001",
    "customerName": "Test Customer",
    "customerPhone": "+1234567890",
    "customerEmail": null,
    "address": "123 Test St",
    "addressLine2": null,
    "city": "Test City",
    "postalCode": "12345",
    "latitude": null,
    "longitude": null,
    "deliveryNotes": null,
    "orderValue": null,
    "priority": "NORMAL",
    "timeWindow": null,
    "status": "PENDING",
    "createdAt": "2025-10-25T18:48:15.238Z",
    "updatedAt": "2025-10-25T18:48:15.238Z"
  }
}
```

**Status:** ✅ SUCCESS

---

## Quick Test Commands

### Get Order Statistics
```bash
curl -X GET http://localhost:5001/api/orders/stats \
  -H "Authorization: Bearer $TOKEN"
```

### Get All Orders
```bash
curl -X GET "http://localhost:5001/api/orders?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```
{
    "orders": [
        {
            "id": "cmh6musna0000xfg13wnjofqc",
            "orderNumber": "ORD-TEST-001",
            "customerName": "Test Customer",
            "customerPhone": "+1234567890",
            "customerEmail": null,
            "address": "123 Test St",
            "addressLine2": null,
            "city": "Test City",
            "postalCode": "12345",
            "latitude": null,
            "longitude": null,
            "deliveryNotes": null,
            "orderValue": null,
            "priority": "NORMAL",
            "timeWindow": null,
            "status": "PENDING",
            "createdAt": "2025-10-25T18:48:15.238Z",
            "updatedAt": "2025-10-25T18:48:15.238Z",
            "routeStop": null
        },
        {
            "id": "cmh6aw7ns0004xfayqh4fgtl4",
            "orderNumber": "ORD-002",
            "customerName": "Bob Smith",
            "customerPhone": "+1234567801",
            "customerEmail": null,
            "address": "456 Oak Ave",
            "addressLine2": null,
            "city": "New York",
            "postalCode": "10002",
            "latitude": null,
            "longitude": null,
            "deliveryNotes": null,
            "orderValue": null,
            "priority": "HIGH",
            "timeWindow": null,
            "status": "PENDING",
            "createdAt": "2025-10-25T13:13:25.960Z",
            "updatedAt": "2025-10-25T13:13:25.960Z",
            "routeStop": null
        },
        {
            "id": "cmh6aw7np0003xfayzztf2hy3",
            "orderNumber": "ORD-001",
            "customerName": "Alice Johnson",
            "customerPhone": "+1234567800",
            "customerEmail": null,
            "address": "123 Main St",
            "addressLine2": null,
            "city": "New York",
            "postalCode": "10001",
            "latitude": null,
            "longitude": null,
            "deliveryNotes": null,
            "orderValue": null,
            "priority": "NORMAL",
            "timeWindow": null,
            "status": "PENDING",
            "createdAt": "2025-10-25T13:13:25.957Z",
            "updatedAt": "2025-10-25T13:13:25.957Z",
            "routeStop": null
        }
    ],
    "pagination": {
        "total": 3,
        "page": 1,
        "limit": 10,
        "totalPages": 1
    }
}

### Get Specific Order by ID
```bash
curl -X GET http://localhost:5001/api/orders/cmh6musna0000xfg13wnjofqc \
  -H "Authorization: Bearer $TOKEN"
```

### Search Orders
```bash
curl -X GET "http://localhost:5001/api/orders?search=Test&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### Filter by Status
```bash
curl -X GET "http://localhost:5001/api/orders?status=PENDING&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

---

**Last Updated:** January 25, 2025
