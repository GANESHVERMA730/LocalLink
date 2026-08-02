# LocalLink — JavaScript Conversion, Hardening & Feature Build-Out

## Role & context

You are working in an existing project called **LocalLink**, a hyperlocal services marketplace (think: find and book a nearby plumber, electrician, tutor, cleaner, etc.). It is already a functioning MERN application:

- **Backend** (`/server`): Node.js + Express + MongoDB via Mongoose + Socket.io (real-time chat) + JWT auth + bcrypt + Zod validation + express-rate-limit. Already plain JavaScript (ES modules) — do not change this.
- **Frontend** (`/src`, root): React 18 + **TypeScript** + Vite + React Router v7 + Tailwind CSS + Axios + Socket.io-client + lucide-react icons.
- There is also a `/supabase` folder containing SQL migrations. **This is unused, vestigial scaffolding** from the original project template — the app does not use Supabase anywhere; it uses the custom Express/MongoDB backend exclusively. Confirm nothing imports `@supabase/*` (it shouldn't), then delete this folder in Phase 3.

Core domain model already implemented: `User` (customer/provider role), `ProviderProfile` (geospatial `2dsphere` index for location search), `Service`, `Availability`, `Booking` (enforced state machine: pending → accepted/rejected/cancelled → completed/cancelled), and `Message` (booking-scoped real-time chat).

**Your overall goal:** convert the frontend to plain JavaScript (no TypeScript anywhere), clean up the project structure, make every page fully responsive, make the whole app fully functional end-to-end, and extend it into a complete, production-plausible hyperlocal marketplace by adding the features listed in Phase 5.

## Hard constraints — do not violate these

1. **No TypeScript, anywhere, including new files.** Every file you create must be `.js` or `.jsx`, never `.ts` or `.tsx`. This applies to config files too (`vite.config.js`, not `.ts`).
2. Keep the MERN stack as-is: MongoDB/Mongoose, Express, React, Node. Do not swap in a different backend, ORM, or framework.
3. Keep Vite, Tailwind CSS, React Router, Socket.io, and the JWT auth flow. Do not replace them.
4. Do not weaken any existing security measure (JWT verification, bcrypt hashing, Zod input validation, rate limiting, Socket.io auth handshake, CORS config).
5. Don't break what already works. The auth flow, geospatial provider search, booking state machine, and real-time chat are already solid — extend them, don't rewrite them from scratch.
6. Work through the phases below **in order**, and after each phase, verify the app still builds and runs before moving on (see "Self-verification" at the end). Prefer small, reviewable changes over one giant unreviewable rewrite.
7. Keep all secrets and config in `.env` files (never hardcode a URI, key, or secret in source).

---

## Phase 1 — Fix known bugs

1. **Critical bug** in `server/routes/providers.js`, inside the `GET /search` handler:
   ```js
   const d = new date(date);
   ```
   The destructured query parameter `date` shadows the global `Date` constructor, so this line throws `TypeError: date is not a constructor` any time a customer searches with a `date` filter set. Rename the destructured variable (e.g. `dateParam`) and fix the instantiation to `new Date(dateParam)`. Manually verify this route works with a `?date=` query string after the fix.
2. Search `server/` for similar variable-shadowing bugs and silently-swallowed errors — e.g. the `catch (e) { /* ignore */ }` block in the `join:booking` Socket.io handler in `server/index.js`. Replace silent catches with at least a `console.error` so failures are visible during development.
3. Confirm every Mongoose `.populate()` call and the aggregation pipeline in `providers.js` still return the expected shape after your fixes.

## Phase 2 — Convert TypeScript to plain JavaScript

1. Rename every `.tsx` → `.jsx` and every `.ts` → `.js` under `src/`.
2. Strip all TypeScript-only syntax throughout: `interface`/`type` declarations, generic type parameters, `: Type` annotations on variables/params/return types, `as Type` casts, `!` non-null assertions, `import type` statements.
3. `src/types/db.ts` has no TypeScript-runtime equivalent — it mixes real runtime constants (`SERVICE_CATEGORIES`, `PRICE_UNITS`, `DAYS_OF_WEEK`) with pure types (`User`, `Booking`, etc.). Move the runtime constants to `src/constants/categories.js` and drop the type-only exports (their shape should now just be implicit in how the objects are used). Optionally, add a JSDoc `@typedef` block at the top of relevant files (e.g. `src/lib/queries.js`) describing the shape of `User`/`Booking`/`ProviderProfile` objects, purely as editor-hint documentation — this is optional but recommended since compile-time type safety is going away.
4. Delete `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, and `src/vite-env.d.ts`.
5. Rename `vite.config.ts` → `vite.config.js` (same content, no type annotations).
6. Rewrite `eslint.config.js` for plain JS/JSX: drop `typescript-eslint` and the `tseslint.config(...)` wrapper; use `@eslint/js` recommended rules plus `eslint-plugin-react` (add this package) alongside the existing `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`; change the `files` glob to `**/*.{js,jsx}`.
7. Update root `package.json`:
   - Remove `typescript`, `@types/react`, `@types/react-dom`, `typescript-eslint` from `devDependencies`.
   - Remove the `typecheck` script.
   - Add `prop-types` as a dependency and use it for lightweight runtime prop validation on components that take non-trivial props (forms, cards, modals) — this replaces some of the safety net TypeScript was providing.
8. Update `index.html`: change `<script type="module" src="/src/main.tsx">` to `src="/src/main.jsx"`.
9. Fix every import path across the codebase that referenced a now-renamed file or the old `types/db` module.
10. Run `npm run build` and `npm run lint` in the frontend and fix every error before starting Phase 3.

## Phase 3 — Clean up project structure

1. Delete the entire `/supabase` directory (unused SQL migrations — see context above).
2. Reorganize `src/` for clarity now that it's plain JS:
   - `src/constants/` — the category/price/day constants from Phase 2.
   - `src/hooks/` — extract any reusable logic into custom hooks as you touch pages (e.g. a `useDebounce` for search inputs, if useful for the address autocomplete in Phase 5).
   - Keep `src/lib/` (api, socket, queries, format), `src/context/`, `src/components/`, and `src/pages/` (with its existing `customer/` and `provider/` subfolders) — this split is already good.
3. Add a root dev convenience: install `concurrently` as a root devDependency and add a `dev:all` script that runs the backend (`npm run dev --prefix server`) and the frontend (`vite`) together, so one command boots the whole stack. Keep the existing individual `dev` scripts too.
4. Add a basic Prettier config for consistent formatting across the now-larger JS codebase.

## Phase 4 — Full responsive design pass

Audit every page and component — `Landing`, `Login`, `Register`, `CustomerSearch`, `ProviderProfile`, `BookingsList`, `BookingDetail`, `ProfileSettings`, `ProviderProfileEditor`, `ServicesManager`, `AvailabilityEditor`, `ProviderDashboard`, `Navbar`, `SearchForm`, `ProviderCard`, `BookingModal`, `ChatWindow` — at three widths: **375px** (mobile), **768px** (tablet), **1440px** (desktop). For each:

- Eliminate any fixed pixel widths that overflow on small screens.
- Use responsive grid patterns consistently (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`-style), matching the pattern already used in `CustomerSearch`.
- Make sure `BookingModal` is scrollable and never exceeds viewport height on small screens.
- Make sure `ChatWindow` resizes correctly and its input stays reachable above the on-screen keyboard on mobile.
- Turn dense data (bookings list, availability editor, provider dashboard tables) into stacked card layouts on narrow screens instead of letting them overflow or truncate badly.
- Keep using the existing design tokens — the `primary`/`accent`/`ink` color scales and the `.btn` / `.card` / `.input` / `.badge` component classes already defined in `src/index.css`. Don't introduce a second, inconsistent design system.
- `Navbar` already has a working mobile hamburger menu — just confirm it still works after the JS conversion, don't rebuild it.

## Phase 5 — New features (complete the marketplace)

Implement fully, frontend-to-backend — no stubs or placeholder UI. Work top to bottom; 5.1–5.3 matter most, 5.4–5.7 are valuable but lower priority if time is constrained.

### 5.1 Reviews & ratings (do this first — the UI already expects it)
`StarRating` (in `src/components/ui`) and the `rating` / `reviewCount` fields on `ProviderProfile` already exist and render on `ProviderCard` — nothing currently writes to them. Build:
- `Review` model: `booking` (ref, unique — one review per booking), `customer` (ref), `provider` (ref), `rating` (Number, 1–5), `comment` (String, optional, max 1000), timestamps.
- `server/routes/reviews.js`: `POST /api/reviews` (only by the booking's customer, only when `booking.status === 'completed'`, only once per booking — enforce all three server-side); `GET /api/reviews/provider/:providerId` (paginated list).
- On review creation, recompute and persist that provider's average `rating` and `reviewCount` on `ProviderProfile`.
- Frontend: a "Leave a review" prompt on `BookingDetail` once a booking is `completed` and unreviewed; a reviews list on the public provider profile page.

### 5.2 Image uploads
Real photo upload for `User.profileImage` and a new `images` array on `Service`. Use `multer` on the backend, writing to `server/uploads/` served statically at `/uploads`, with file-type (images only) and size (5MB max) validation. Add a file input + preview to `ProfileSettings`, `ProviderProfileEditor`, and `ServicesManager`. Note in your final summary that swapping local disk storage for S3/Cloudinary is a drop-in replacement for real production deployment and is intentionally out of scope here.

### 5.3 Real location search
Replace raw lat/lng typing with an address input using free, keyless geocoding via the Nominatim (OpenStreetMap) API — convert the typed address to coordinates client-side, then call the existing `/api/providers/search` endpoint unchanged. Add an interactive map using `leaflet` + `react-leaflet` (v4.x, which targets React 18 — don't pull v3 or v5+) with OSM tiles (no API key required) showing pins for search results, plus a small static map on the provider profile page. Keep the existing "use my location" geolocation button working.

### 5.4 Favorites / saved providers
Add a `favorites` array (ref `User`) on the `User` model, `GET/POST/DELETE /api/users/me/favorites[/:providerId]`, a save/heart toggle on `ProviderCard`, and a "Saved" view in the customer dashboard.

### 5.5 In-app notifications
`Notification` model (`user`, `type`, `message`, `link`, `read`, timestamps), created on booking create/accept/reject/complete and on new chat messages when the recipient isn't actively in that booking room. Bell icon with unread count in `Navbar`, dropdown list, mark-as-read on click, live update via a Socket.io event in addition to persisting so it survives a reload.

### 5.6 Pagination
Add `page`/`limit` params (default 12) to `GET /api/providers/search` and `GET /api/bookings`, returning `{ items, page, totalPages, total }`. Add "Load more" or paged controls on the corresponding pages.

### 5.7 Forgot / reset password
`POST /api/auth/forgot-password` (signed, time-limited token, emails a reset link) and `POST /api/auth/reset-password`. Use `nodemailer` against an auto-generated Ethereal test account in development (no signup needed, logs a preview URL to the console) and clearly comment where a real provider (SendGrid, SES, etc.) would be swapped in for production.

Also: extend `server/seed.js` so a fresh clone immediately has a couple of demo reviews and notifications for the seeded accounts, not just the original core data.

## Phase 6 — Production polish

- Add a global React error boundary and a proper "not found" screen (there's currently a silent `path="*"` redirect to landing — either replace it with a real 404 or keep the redirect deliberately, but add the error boundary regardless).
- Add `react-hot-toast` (or similar lightweight toast library) and use it for every success/error action (login, booking status change, review submitted, favorite saved, etc.) instead of relying only on inline banners.
- Add client-side form validation with `react-hook-form` mirroring the existing backend Zod rules, so users get instant feedback instead of a round trip for basic mistakes.
- Replace the leftover Bolt.new default Open Graph image URL in `index.html` with a real project image (or drop the tag), and replace the default Vite favicon.
- Add loading skeletons (not just spinners) to the search results grid and bookings list.
- Basic accessibility pass: alt text on every image/avatar, `aria-label` on icon-only buttons (match the pattern already used on the navbar's menu toggle), focus trapping inside `BookingModal`.
- Consider a general, lighter rate limiter across all `/api` routes (not just `/auth`) to protect the search and booking endpoints from abuse.
- Update `README.md` to reflect the JS-only stack, every new feature, updated setup steps, and any new environment variables your changes introduce.
- Update both `.env.example` files (root and `server/`) with every new variable you add (e.g. `EMAIL_*` vars, `UPLOAD_DIR`, etc.).

---

## Self-verification — do this before reporting completion

1. From the repo root: `npm install && npm run build` — must succeed with zero errors.
2. From `server/`: `npm install && npm run dev` — must boot cleanly, connect to MongoDB, and log the running port.
3. `npm run lint` in the frontend — zero errors (warnings are acceptable).
4. Manually trace the full flow end to end and confirm each step has a working code path: register (both roles) → provider creates profile/service/availability → customer searches (by address, by map, with filters) → customer books → provider accepts → both chat in real time → provider marks complete → customer leaves a review → rating updates on the provider card.
5. Produce a short `CHANGELOG.md` (or a new section in `README.md`) summarizing everything changed/added per phase, plus anything you deliberately left out of scope.

If the scope above is too large to complete reliably in one pass, stop at the end of a phase, report what's done and verified, and wait for confirmation before continuing to the next phase rather than rushing through all six.
