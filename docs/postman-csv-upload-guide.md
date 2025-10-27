# Postman Guide: CSV Upload Testing

Purpose: Step-by-step instructions for testing CSV upload in Postman

---

## Prerequisites

1. **Postman installed** - Download from https://www.postman.com/downloads/
2. **Backend server running** - `npm run dev` in backend folder
3. **Authentication token** - Get from login endpoint
4. **Test CSV file** - Created on your Desktop

---

## Step 1: Create Test CSV File

First, create a test CSV file:

```bash
cd ~/Desktop

cat > test-orders.csv << 'EOF'
Order Number,Customer Name,Phone,Email,Address,City,Postal Code,Priority,Notes
ORD-201,Alice Brown,+1111111111,alice@test.com,100 First St,Boston,02101,NORMAL,Ring doorbell
ORD-202,Bob White,+2222222222,bob@test.com,200 Second Ave,Boston,02102,HIGH,Leave with neighbor
ORD-203,Carol Green,+3333333333,carol@test.com,300 Third Rd,Cambridge,02139,URGENT,Call before delivery
EOF
```

Verify file exists:
```bash
ls -la ~/Desktop/test-orders.csv
```

---

## Step 2: Get Authentication Token in Postman

### 2.1 Create Login Request

1. Open Postman
2. Click **"New"** → **"HTTP Request"**
3. Set method to **POST**
4. Enter URL: `http://localhost:5001/api/auth/login`
5. Go to **"Body"** tab
6. Select **"raw"**
7. Select **"JSON"** from dropdown
8. Enter:
```json
{
  "email": "admin@swiftroute.com",
  "password": "admin123"
}
```
9. Click **"Send"**

### 2.2 Save Token

From the response, copy the token:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}
```

**Copy the entire token value** (the long string after "token":)

---

## Step 3: Upload CSV in Postman

### 3.1 Create Upload Request

1. Create a **new HTTP request**
2. Set method to **POST**
3. Enter URL: `http://localhost:5001/api/orders/upload-csv`

### 3.2 Add Authorization

1. Go to **"Authorization"** tab
2. Type: Select **"Bearer Token"**
3. Token: Paste your copied token
   