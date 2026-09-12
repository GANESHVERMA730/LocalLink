# LocalLink — Hyperlocal Service Marketplace

## 🌐 Live Demo

🚀 [View Live Project](https://local-link-sigma.vercel.app)

A production-ready MERN-stack web application connecting customers with trusted local service providers — plumbers, electricians, tutors, cleaners, carpenters, and more — using geospatial search, real-time chat, and a booking state machine.

---

## Features

| Feature | Details |
|---------|---------|
| **Authentication** | JWT-based login/register with bcrypt, role-based (customer / provider) |
| **Provider Search** | Geospatial search by address name, category, minimum rating, and date availability |
| **Leaflet Map** | Interactive map view with provider pins and list/map toggle |
| **Address Autocomplete** | Nominatim-backed address search with coordinate resolution |
| **Booking Flow** | Full state machine: pending → accepted / rejected → completed / cancelled |
| **Real-time Chat** | Socket.io chat per booking with typing indicator |
| **Notifications** | In-app real-time notifications for booking events and new messages |
| **Reviews & Ratings** | Post-completion reviews; provider rating auto-recomputed on each review |
| **Favorites** | Customers can save and view favourite providers |
| **Avatar Upload** | Multer-based image upload with old-file cleanup and path traversal protection |
| **Password Reset** | Token-based forgot/reset flow via email (Ethereal in dev, SMTP in production) |
| **Responsive UI** | Tailwind CSS responsive layout, mobile-first |
| **Error Boundary** | React error boundary catches unexpected component errors |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express, MongoDB (Mongoose), Socket.io, JWT, bcryptjs, Zod, Multer, Nodemailer |
| **Frontend** | React 18, Vite, React Router v7, Tailwind CSS, Axios, Socket.io-client, Leaflet |
| **Database** | MongoDB with 2dsphere geospatial index on `ProviderProfile.location` |
| **Validation** | Zod on all backend routes; HTML5 constraint validation on forms |

---

## Project Structure

```
locallink/
├── server/                        # Express + Socket.io backend
│   ├── index.js                   # HTTP server + Socket.io entry point
│   ├── seed.js                    # Idempotent demo data seeder
│   ├── .env.example               # Required environment variables
│   ├── config/
│   │   └── db.js                  # Mongoose connection
│   ├── middleware/
│   │   ├── auth.js                # JWT auth + requireRole()
│   │   └── errorHandler.js        # Global error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── ProviderProfile.js     # Includes 2dsphere index
│   │   ├── Service.js
│   │   ├── Availability.js
│   │   ├── Booking.js             # Append-only statusHistory
│   │   ├── Review.js              # Unique per booking; triggers rating recompute
│   │   ├── Message.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js               # Profile, favorites
│   │   ├── providers.js           # Geospatial search + CRUD
│   │   ├── services.js
│   │   ├── availabilities.js
│   │   ├── bookings.js            # State machine + chat history
│   │   ├── reviews.js
│   │   ├── notifications.js
│   │   ├── uploads.js             # Avatar + service image upload (Multer)
│   │   ├── geocode.js             # Nominatim forward/reverse geocode proxy
│   │   └── passwordReset.js       # Forgot/reset password with rate limiting
│   └── uploads/                   # Uploaded files (excluded from git)
│       └── .gitkeep
├── src/                           # React + Vite frontend
│   ├── App.jsx                    # Router with all routes + ErrorBoundary
│   ├── main.jsx
│   ├── index.css
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── FavoritesContext.jsx
│   │   └── NotificationContext.jsx
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── SearchForm.jsx
│   │   ├── ProviderCard.jsx
│   │   ├── BookingModal.jsx
│   │   ├── BookingCard.jsx
│   │   ├── BookingTimeline.jsx
│   │   ├── ChatWindow.jsx
│   │   ├── ReviewsSection.jsx
│   │   ├── ReviewPrompt.jsx
│   │   ├── FavoriteButton.jsx
│   │   ├── AddressAutocomplete.jsx
│   │   └── ui.jsx                 # Shared UI primitives
│   ├── lib/
│   │   ├── api.js                 # Axios instance + JWT interceptor + resolveMediaUrl
│   │   ├── socket.js              # Socket.io client singleton
│   │   ├── queries.js             # All API call functions
│   │   └── format.js              # Date/price formatters
│   └── pages/
│       ├── Landing.jsx
│       ├── Login.jsx
│       ├── Register.jsx
│       ├── ForgotPassword.jsx
│       ├── ResetPassword.jsx
│       ├── ProfileSettings.jsx
│       ├── BookingsList.jsx
│       ├── BookingDetail.jsx
│       ├── customer/
│       │   ├── CustomerDashboard.jsx
│       │   ├── CustomerSearch.jsx
│       │   ├── Favorites.jsx
│       │   └── ProviderProfile.jsx
│       └── provider/
│           ├── ProviderDashboard.jsx
│           ├── ProviderProfileEditor.jsx
│           ├── ServicesManager.jsx
│           └── AvailabilityEditor.jsx
├── public/
│   ├── favicon.png
│   └── og-image.png
├── .env.example                   # Frontend environment variables
├── vercel.json                    # Vercel SPA routing rewrite
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Prerequisites

- **Node.js 20+**
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) free tier

---

## Installation & Setup

### 1. Backend

```bash
cd server
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET at minimum
npm install
```

### 2. Frontend

```bash
# From the project root
cp .env.example .env
# Edit .env if your backend runs on a different port
npm install
```

### 3. Run in development

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
npm run dev
```

Or run both at once from the project root:
```bash
npm run dev:all
```

Open [http://localhost:5173](http://localhost:5173)

---

## Environment Variables

### `server/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Long random string for signing tokens |
| `PORT` | — | Defaults to `5000` |
| `CLIENT_URL` | ✅ | Frontend origin for CORS + reset links (e.g. `http://localhost:5173`) |
| `ENABLE_DEV_RESET_LINK` | — | `true` returns reset token in API response (dev only — **never set true in production**) |
| `GEOCODE_USER_AGENT` | — | Sent to Nominatim (required by OSM usage policy) |
| `EMAIL_USER` | — | SMTP username for production email |
| `EMAIL_PASS` | — | SMTP password for production email |

### `.env` (frontend root)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL, e.g. `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Backend Socket.io origin, e.g. `http://localhost:5000` |

---

## Seed Demo Data

```bash
cd server
node seed.js
```

The seed is **idempotent** — it removes previous demo records by email before re-creating them. Running it twice is safe.

### Demo Credentials (password: `Demo@12345` for all)

**Customers**

| Name | Email |
|------|-------|
| Demo Customer | `customer.demo1@locallink.test` |
| Rahul Sharma | `customer.demo2@locallink.test` |

**Providers** (all based in Lucknow, UP)

| Name | Email | Category | Area |
|------|-------|----------|------|
| Rajesh Kumar | `provider.plumber@locallink.test` | Plumber | Aliganj |
| Amit Verma | `provider.electrician@locallink.test` | Electrician | Gomti Nagar |
| Priya Sharma | `provider.tutor@locallink.test` | Tutor | Indira Nagar |
| Neha Singh | `provider.cleaner@locallink.test` | Cleaner | Hazratganj |
| Arjun Patel | `provider.carpenter@locallink.test` | Carpenter | Mahanagar |

---

## API Overview

### Auth

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Register — `{ name, email, password, role, phone }` |
| `POST` | `/api/auth/login` | Login — returns `{ token, user }` |
| `POST` | `/api/auth/forgot-password` | Request password reset link |
| `POST` | `/api/auth/reset-password` | Reset password with token |

### Users

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/users/me` | Fetch authenticated user |
| `PATCH` | `/api/users/me` | Update name / phone / profileImage |
| `GET` | `/api/users/me/favorites` | List saved providers |
| `POST` | `/api/users/me/favorites` | Save a provider |
| `DELETE` | `/api/users/me/favorites/:id` | Remove a saved provider |

### Providers

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/providers/search` | Geospatial search — `lat`, `lng`, `maxDistance`, `category`, `minRating`, `date` |
| `GET` | `/api/providers/:id` | Public profile + services + availability |
| `POST` | `/api/providers` | Create provider profile (provider role) |
| `PATCH` | `/api/providers/me` | Update own profile |
| `GET` | `/api/providers/me/profile` | Own profile including all services |

### Services

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/services` | List own services (provider) |
| `POST` | `/api/services` | Create service |
| `PATCH` | `/api/services/:id` | Update service |
| `DELETE` | `/api/services/:id` | Delete service |

### Bookings

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/bookings` | Create booking (customer) |
| `GET` | `/api/bookings` | List bookings for current user |
| `GET` | `/api/bookings/:id` | Single booking detail |
| `PATCH` | `/api/bookings/:id` | Advance booking status (state machine) |
| `GET` | `/api/bookings/:id/messages` | Chat history |

### Booking State Machine

```
pending ──► accepted ──► completed
   │              └──────► cancelled
   └──► rejected
   └──► cancelled (customer only)
```

### Other

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/reviews/provider/:id` | Paginated reviews + aggregate |
| `POST` | `/api/reviews` | Create review (completed bookings only) |
| `GET` | `/api/notifications` | List notifications |
| `POST` | `/api/uploads/avatar` | Upload profile photo (multipart, max 5 MB) |
| `GET` | `/api/geocode/search` | Forward geocode via Nominatim |
| `GET` | `/api/geocode/reverse` | Reverse geocode |
| `GET` | `/api/health` | Health check |

---

## Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join:booking` | Client → Server | Join booking chat room |
| `chat:sendMessage` | Client → Server | Send message (validated against booking membership) |
| `chat:newMessage` | Server → Client | New message broadcast to booking room |
| `chat:typing` | Bidirectional | Typing indicator |
| `booking:updated` | Server → Client | Booking status changed |
| `notification:new` | Server → Client | New notification for user |

---

## Image Uploads

Uploaded files are served as static files from `server/uploads/` at `/uploads/<filename>`.

The `resolveMediaUrl(src)` utility in `src/lib/api.js` prefixes the backend origin to `/uploads/…` paths so they resolve correctly in both development (via Vite proxy) and production.

> **Production note:** `server/uploads/` is local disk storage. On platforms with ephemeral filesystems (Render free tier, Heroku), uploaded files are lost on redeploy. To make uploads durable in production, replace the multer disk storage in `server/routes/uploads.js` with a Cloudinary or S3 adapter — the frontend contract (upload returns `{ url }`, PATCH saves the URL string) does not need to change.

---

## Address Autocomplete & Map

- **Geocoding:** Nominatim (OpenStreetMap) via the `/api/geocode` proxy. The proxy enforces the `GEOCODE_USER_AGENT` header required by the OSM usage policy.
- **Map:** React-Leaflet with OpenStreetMap tiles. Provider pins are rendered using `ProviderCard` popups.
- Customers search by location name (e.g. "Aliganj, Lucknow") — the frontend resolves to coordinates and passes `lat`/`lng` to the provider search.

---

## Password Reset

In **development** (`ENABLE_DEV_RESET_LINK=true`), the API response includes `devResetUrl` so you can paste the link directly without email delivery.

In **production** (`ENABLE_DEV_RESET_LINK=false` or unset), the URL is only sent via email. The API response never exposes the token.

Email is sent via Nodemailer. In development it auto-creates an [Ethereal](https://ethereal.email/) test account and logs the preview URL to the server console.

---

## SPA Routing

Direct URL access (e.g. refreshing `/dashboard/search`) is handled by:

- **Netlify:** `public/_redirects` — `/* /index.html 200`
- **Vercel:** `vercel.json` rewrites

---

## Deployment

### Backend (Render / Railway)

1. Push to GitHub
2. Connect the repo, set root directory to `server/`
3. Build command: *(none — pure Node)*
4. Start command: `node index.js`
5. Set environment variables: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `PORT`, `ENABLE_DEV_RESET_LINK=false`

### Frontend (Vercel / Netlify)

1. Connect the repo
2. Build command: `npm run build`
3. Output directory: `dist`
4. Environment variables: `VITE_API_URL`, `VITE_SOCKET_URL` (both pointing to your deployed backend)

### MongoDB Atlas

1. Create a free M0 cluster
2. Create a database user
3. Add your server's IP (or `0.0.0.0/0` for Railway/Render)
4. Copy the connection string into `MONGODB_URI`

---

## CORS & Security

- CORS is restricted to the `CLIENT_URL` origin — set this to your deployed frontend URL in production.
- Socket.io is also gated to `CLIENT_URL`.
- All routes use Zod schema validation.
- Auth routes are rate-limited with `express-rate-limit`.
- File uploads are validated by MIME type and capped at 5 MB.
- JWT tokens are verified on every authenticated request; invalid tokens return 401.

---

## Service Image Upload (Future Enhancement)

The backend exposes `POST /api/uploads/service-image` for per-service images, and the `Service` model has no image field yet. The `ServicesManager` UI does not currently expose an image picker. This is a non-blocking future enhancement — the core marketplace is fully functional without per-service images.

---

## Building for Production

```bash
# Frontend
npm run build       # outputs to dist/

# Backend — no build step, runs directly with Node.js
cd server
npm start
```
