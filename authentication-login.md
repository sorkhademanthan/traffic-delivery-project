curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@swiftroute.com",
    "password": "test123",
    "name": "Test User"
  }'

  curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@swiftroute.com",
    "password": "admin123"
  }'

{
    "message": "User registered successfully",
    "user": {
        "id": "cmh687nsr0000xfs62j95e9ur",
        "email": "test@swiftroute.com",
        "name": "Test User",
        "role": "ADMIN",
        "isActive": true,
        "createdAt": "2025-10-25T11:58:21.243Z"
    }
}

{
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWg2ODduc3IwMDAweGZzNjJqOTVlOXVyIiwiZW1haWwiOiJ0ZXN0QHN3aWZ0cm91dGUuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzYxMzkzODY0LCJleHAiOjE3NjE5OTg2NjR9.PdmvW6zgjCt6EObICRhbSEK2FoOa7Mfm03IXIBZ9kX4",
    "user": {
        "id": "cmh687nsr0000xfs62j95e9ur",
        "email": "test@swiftroute.com",
        "name": "Test User",
        "role": "ADMIN"
    }
}

{
    "user": {
        "id": "cmh687nsr0000xfs62j95e9ur",
        "email": "test@swiftroute.com",
        "name": "Test User",
        "role": "ADMIN",
        "isActive": true,
        "createdAt": "2025-10-25T11:58:21.243Z",
        "updatedAt": "2025-10-25T11:58:21.243Z"
    }
}

-----------------------------------------------------------------------------
