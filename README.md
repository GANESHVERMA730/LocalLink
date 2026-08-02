# LocalLink — Hyperlocal Service Marketplace

A production-ready MERN-stack web app connecting customers with nearby service providers (plumbers, electricians, tutors, etc.) using geospatial search, real-time chat, and a booking state machine.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express, MongoDB (Mongoose), Socket.io, JWT, bcrypt, Zod |
| Frontend | React 18, Vite, React Router, Tailwind CSS, Axios, Socket.io-client |
| Database | MongoDB with 2dsphere geospatial indexes |

## Project Structure

```
locallink/
├── server/                  # Express + Socket.io backend
│   ├── index.js             # Entry point (HTTP + Socket.io)
│   ├── seed.js              # Demo data seeder
│   ├── .env.example
│   ├── config/db.js         # Mongoose connection
│   ├── models/              # User, ProviderProfile, Service, Availability, Booking, Message
│   ├── middleware/          # auth (JWT), errorHandler
│   └── routes/              # auth, users, providers, services, availabilities, bookings
├── src/                     # React + Vite frontend
│   ├── App.tsx              # Router with all routes
│   ├── main.tsx
│   ├── context/AuthContext.tsx
│   ├── components/          # Navbar, SearchForm, ProviderCard, ChatWindow, BookingModal, ui
│   ├── lib/                 # api.ts (Axios), socket.ts (Socket.io), queries.ts, format.ts
│   ├── pages/               # Landing, Login, Register, customer/, provider/
│   └── types/db.ts
├── .env                     # Frontend env vars
└── package.json
```

## Prerequisites

- Node.js 20+
- MongoDB (local or [Atlas](https://www.mongodb.com/atlas))

## Setup

### 1. Backend

```bash
cd server
cp .env.example .env
# Edit .env with your MONGODB_URI and JWT_SECRET
npm install
```

### 2. Frontend

```bash
# From project root
npm install
```

### 3. Environment Variables

**`server/.env`:**
```
MONGODB_URI=mongodb+srv://user:pass@cluster.../locallink?retryWrites=true&w=majority
JWT_SECRET=your_secure_random_string
PORT=5000
CLIENT_URL=http://localhost:5173
```

**`.env` (frontend, project root):**
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Seed Demo Data

```bash
cd server
node seed.js
```

This creates:
- 3 providers (plumber, electrician, tutor) with profiles, services, and availability in the NYC area
- 1 customer

**All demo accounts use password: `demo123456`**

| Email | Role |
|-------|------|
| customer@local.link | Customer |
| plumber@local.link | Provider (Plumber) |
| electric@local.link | Provider (Electrician) |
| tutor@local.link | Provider (Tutor) |

### 5. Run Locally

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
npm run dev
```

Open http://localhost:5173

## Testing Core Flows

1. **Login as a customer** (`customer@local.link` / `demo123456`)
   - Go to Search, enter `40.71,-74.00` as coordinates or click "Use my location"
   - Filter by category and radius
   - Click a provider, view their profile, and book a service

2. **Login as a provider** (`plumber@local.link` / `demo123456`) in another browser/incognito
   - Go to Bookings to see incoming requests
   - Accept or reject the booking
   - Open the booking chat and send messages

3. **Real-time chat:** Open the booking in both sessions — messages appear instantly

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register (name, email, password, role, phone) |
| POST | /api/auth/login | Login → returns JWT + user |
| GET | /api/users/me | Current user profile |
| PATCH | /api/users/me | Update profile |
| GET | /api/providers/search | Geospatial search (lat, lng, maxDistance, category, minRating, date) |
| GET | /api/providers/:id | Public provider profile + services + availability |
| POST | /api/providers | Create provider profile (provider only) |
| PATCH | /api/providers/me | Update own provider profile |
| GET | /api/services | List services |
| POST | /api/services | Create service (provider only) |
| PATCH | /api/services/:id | Update service |
| DELETE | /api/services/:id | Delete service |
| POST | /api/availabilities | Create availability slot |
| PATCH | /api/availabilities/:id | Update availability |
| DELETE | /api/availabilities/:id | Delete availability |
| GET | /api/availabilities/provider/:providerId | List provider availability |
| POST | /api/bookings | Create booking (customer) |
| PATCH | /api/bookings/:id | Update booking status (state machine) |
| GET | /api/bookings | List bookings for current user |
| GET | /api/bookings/:id | Single booking detail |
| GET | /api/bookings/:id/messages | Message history |

## Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join:booking` | Client → Server | Join a booking chat room |
| `chat:sendMessage` | Client → Server | Send a message (validated against booking membership) |
| `chat:newMessage` | Server → Client | New message broadcast to booking room |
| `booking:updated` | Server → Client | Booking status changed |

## Deployment

### Backend (Render / Railway)

1. Push to GitHub
2. Connect repo, set root directory to `server`
3. Set environment variables: `MONGODB_URI`, `JWT_SECRET`, `PORT`, `CLIENT_URL`
4. Start command: `node index.js`

### Frontend (Vercel / Netlify)

1. Connect repo
2. Set `VITE_API_URL` and `VITE_SOCKET_URL` to your deployed backend URL
3. Build command: `npm run build`
4. Output directory: `dist`

### MongoDB Atlas

1. Create a free cluster
2. Create a database user
3. Whitelist `0.0.0.0/0` for development
4. Copy the connection string into `MONGODB_URI`

## Security Features

- JWT authentication with bcrypt password hashing
- Rate limiting on auth endpoints
- Input validation with Zod on all routes
- Booking status transitions enforced server-side (state machine)
- Socket.io JWT verification on connection
- CORS configured for frontend origin
