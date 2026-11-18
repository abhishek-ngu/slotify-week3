# Slotify - Week 4: Booking Logic & Deployment

Backend API for Slotify with JWT-based authentication, slot management, booking system, conflict detection, and deployment-ready configuration.

## Features

- **Authentication**: User registration with bcrypt password hashing, JWT-based login (7-day expiry), protected routes
- **Slot Management**: Create, read, delete slots with ownership enforcement
- **Booking System**: Book slots, cancel bookings with ownership verification
- **Availability Filter**: Query unbooked slots with `?available=true`
- **Conflict Detection**: Prevents overlapping slots on the same day (409 Conflict)
- **User Bookings**: View all booked slots with active/cancelled separation
- **Database**: MongoDB Atlas with Mongoose ODM
- **Security**: Helmet, CORS, input validation, error handling
- **Deployment Ready**: Configured for Railway/Render with environment variables

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **Security**: helmet, cors, morgan
- **Deployment**: Railway / Render

## Project Structure

```
src/
├── config/
│   └── db.js               # Database connection
├── controllers/
│   ├── authController.js   # Auth logic (register, login, me)
│   ├── slotController.js   # Slot CRUD + booking/cancellation
│   └── bookingController.js # User bookings retrieval
├── middleware/
│   ├── auth.js             # JWT protection middleware
│   └── errorHandler.js     # Global error handling
├── models/
│   ├── User.js             # User schema
│   ├── Slot.js             # Slot schema (with booking fields)
│   └── Booking.js          # Booking schema
├── routes/
│   ├── authRoutes.js       # /api/auth routes
│   ├── slotRoutes.js       # /api/slots routes (incl. book/cancel)
│   └── bookingRoutes.js    # /api/bookings routes
├── utils/
│   ├── asyncHandler.js     # Wrapper for async routes
│   └── jwt.js              # JWT utilities
├── app.js                  # Express app setup
└── server.js               # Entry point
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

### Environment Variables

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
| POST | `/api/slots` | Create new slot (conflict detection) | Private |
| GET | `/api/slots` | Get all user's slots | Private |
| GET | `/api/slots?available=true` | Get only unbooked slots | Private |
| GET | `/api/slots/:id` | Get single slot | Private |
| POST | `/api/slots/:id/book` | Book a slot | Private |
| POST | `/api/slots/:id/cancel` | Cancel booking (owner only) | Private |
| DELETE | `/api/slots/:id` | Delete slot | Private |

### Bookings

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/bookings/me` | Get current user's bookings | Private |

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

### Create Slot (Protected) - with Conflict Detection

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
    "isBooked": false,
    "bookedBy": null,
    "bookedAt": null,
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

**Conflict Response (409):**
```json
{
  "success": false,
  "message": "Time conflict with existing slot",
  "conflict": {
    "existingSlot": {
      "id": "64f...",
      "title": "Existing meeting",
      "startTime": "2024-01-15T09:30:00.000Z",
      "endTime": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Get Slots (Protected)

**Request (all slots):**
```bash
GET /api/slots
Authorization: Bearer <token>
```

**Request (available only):**
```bash
GET /api/slots?available=true
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "slots": [
    {
      "_id": "64f...",
      "title": "Meeting with team",
      "description": "Weekly sync",
      "startTime": "2024-01-15T10:00:00.000Z",
      "endTime": "2024-01-15T11:00:00.000Z",
      "isBooked": false,
      "bookedBy": null,
      "bookedAt": null,
      "user": { "_id": "64f...", "name": "John Doe", "email": "john@example.com" },
      "createdAt": "2024-...",
      "updatedAt": "2024-..."
    }
  ]
}
```

### Book a Slot (Protected)

**Request:**
```bash
POST /api/slots/64f.../book
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Slot booked successfully",
  "slot": {
    "_id": "64f...",
    "title": "Meeting with team",
    "startTime": "2024-01-15T10:00:00.000Z",
    "endTime": "2024-01-15T11:00:00.000Z",
    "isBooked": true,
    "bookedBy": { "_id": "64f...", "name": "Jane Smith", "email": "jane@example.com" },
    "bookedAt": "2024-01-10T15:30:00.000Z",
    "user": { "_id": "64f...", "name": "John Doe", "email": "john@example.com" }
  },
  "booking": {
    "_id": "64f...",
    "slot": { "_id": "64f...", "title": "Meeting with team", "startTime": "...", "endTime": "..." },
    "user": { "_id": "64f...", "name": "Jane Smith", "email": "jane@example.com" },
    "status": "booked",
    "bookedAt": "2024-01-10T15:30:00.000Z",
    "cancelledAt": null
  }
}
```

**Already Booked Response (400):**
```json
{
  "success": false,
  "message": "Slot is already booked"
}
```

### Cancel Booking (Protected)

**Request:**
```bash
POST /api/slots/64f.../cancel
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "slot": {
    "_id": "64f...",
    "title": "Meeting with team",
    "isBooked": false,
    "bookedBy": null,
    "bookedAt": null
  },
  "booking": {
    "_id": "64f...",
    "status": "cancelled",
    "cancelledAt": "2024-01-10T16:00:00.000Z"
  }
}
```

**Not Authorized Response (403):**
```json
{
  "success": false,
  "message": "Not authorized to cancel this booking"
}
```

### Get My Bookings (Protected)

**Request:**
```bash
GET /api/bookings/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "activeCount": 2,
  "cancelledCount": 1,
  "bookings": {
    "active": [
      {
        "_id": "64f...",
        "slot": {
          "_id": "64f...",
          "title": "Team Meeting",
          "startTime": "2024-01-15T10:00:00.000Z",
          "endTime": "2024-01-15T11:00:00.000Z",
          "user": { "_id": "64f...", "name": "John Doe", "email": "john@example.com" }
        },
        "status": "booked",
        "bookedAt": "2024-01-10T15:30:00.000Z"
      }
    ],
    "cancelled": [
      {
        "_id": "64f...",
        "slot": {
          "_id": "64f...",
          "title": "Old Meeting",
          "startTime": "2024-01-08T14:00:00.000Z",
          "endTime": "2024-01-08T15:00:00.000Z"
        },
        "status": "cancelled",
        "bookedAt": "2024-01-05T10:00:00.000Z",
        "cancelledAt": "2024-01-07T12:00:00.000Z"
      }
    ]
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
- `400` - Bad Request (validation errors, already booked)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (not authorized to cancel)
- `404` - Not Found
- `409` - Conflict (time overlap on slot creation)
- `500` - Internal Server Error

## Testing with Postman

1. Import the collection (or create requests manually)
2. For protected routes, use **Authorization** tab → **Bearer Token** → paste JWT
3. Test the full flow:
   - Register → Login → Create Slots → Book Slots → Cancel Bookings → View Bookings
4. Test conflict detection by creating overlapping slots
5. Test availability filter with `?available=true`

## Deployment

### Deploy to Railway

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repository
4. Add environment variables in Railway dashboard:
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `JWT_SECRET` - Your secure JWT secret (32+ chars)
   - `NODE_ENV` - `production`
   - `CLIENT_URL` - Your frontend URL (or `*` for all)
5. Deploy!

### Deploy to Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repository
4. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables in Render dashboard (same as above)
6. Deploy!

### Post-Deployment

- Test the live API: `GET https://your-app.railway.app/api/health`
- Update `CLIENT_URL` in `.env` to your production frontend URL
- Share the live API base URL

## Submission Checklist

- [ ] Register and login routes work and return correct responses
- [ ] Passwords are hashed in the database (never stored as plain text)
- [ ] Login returns a valid JWT that can be decoded at jwt.io
- [ ] Protected routes return 401 when no token is provided
- [ ] GET /auth/me returns the correct user from the token
- [ ] POST /slots/:id/book works and prevents double-booking
- [ ] POST /slots/:id/cancel works with ownership check
- [ ] GET /slots?available=true returns only unbooked slots
- [ ] POST /slots returns 409 Conflict for overlapping time slots
- [ ] GET /bookings/me returns user's bookings (active + cancelled)
- [ ] README includes all endpoints with method, auth, and example responses
- [ ] API is live on Railway or Render and reachable via a public URL
- [ ] Live URL and final repo link shared in check-in thread by end of Day 7
- [ ] Code pushed to GitHub with at least 3 meaningful commits

## License

ISC