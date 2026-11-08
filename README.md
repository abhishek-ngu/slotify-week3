# Slotify - Week 3: Authentication & Protected Routes

Backend API for Slotify with JWT-based authentication and protected routes.

## Features

- User registration with password hashing (bcrypt)
- User login with JWT token generation
- Protected routes using JWT middleware
- Slot management (create, read, delete) for authenticated users
- MongoDB Atlas integration
- Security best practices (helmet, cors, validation)

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **Security**: helmet, cors

## Project Structure

```
src/
├── config/
│   └── db.js           # Database connection
├── controllers/
│   ├── authController.js  # Auth logic (register, login, me)
│   └── slotController.js  # Slot CRUD operations
├── middleware/
│   ├── auth.js         # JWT protection middleware
│   └── errorHandler.js # Global error handling
├── models/
│   ├── User.js         # User schema
│   └── Slot.js         # Slot schema
├── routes/
│   ├── authRoutes.js   # /api/auth routes
│   └── slotRoutes.js   # /api/slots routes
├── utils/
│   ├── asyncHandler.js # Wrapper for async routes
│   └── jwt.js          # JWT utilities
├── app.js              # Express app setup
└── server.js           # Entry point
```

## Setup

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` with your MongoDB Atlas connection string and JWT secret
5. Start the server:
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 5000) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `MONGODB_URI` | MongoDB Atlas connection string | **Yes** |
| `JWT_SECRET` | Secret key for signing JWTs (min 32 chars) | **Yes** |
| `JWT_EXPIRES_IN` | Token expiry (default: 7d) | No |
| `CLIENT_URL` | Frontend URL for CORS (default: http://localhost:3000) | No |

## API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user profile | Private |

### Slots

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/slots` | Create new slot | Private |
| GET | `/api/slots` | Get all user's slots | Private |
| GET | `/api/slots/:id` | Get single slot | Private |
| DELETE | `/api/slots/:id` | Delete slot | Private |

## Request/Response Examples

### Register User

**Request:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "64f...",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Login

**Request:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "64f...",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Get Profile (Protected)

**Request:**
```bash
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "64f...",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-...",
    "updatedAt": "2024-..."
  }
}
```

### Create Slot (Protected)

**Request:**
```bash
POST /api/slots
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Meeting with team",
  "description": "Weekly sync",
  "startTime": "2024-01-15T10:00:00.000Z",
  "endTime": "2024-01-15T11:00:00.000Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Slot created successfully",
  "slot": {
    "_id": "64f...",
    "title": "Meeting with team",
    "description": "Weekly sync",
    "startTime": "2024-01-15T10:00:00.000Z",
    "endTime": "2024-01-15T11:00:00.000Z",
    "user": {
      "_id": "64f...",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "createdAt": "2024-...",
    "updatedAt": "2024-..."
  }
}
```

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

Common status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `500` - Internal Server Error

## Testing with Postman

1. Import the collection (or create requests manually)
2. For protected routes, use **Authorization** tab → **Bearer Token** → paste JWT
3. Test the full flow:
   - Register → Login → Use token for protected routes

## Submission Checklist

- [ ] Register and login routes work and return correct responses
- [ ] Passwords are hashed in the database (never stored as plain text)
- [ ] Login returns a valid JWT that can be decoded at jwt.io
- [ ] Protected routes return 401 when no token is provided
- [ ] GET /auth/me returns the correct user from the token
- [ ] Code pushed to GitHub with at least 3 meaningful commits

## License

ISC