# LocalLink — Project Instructions for Claude Code

## What this project is
LocalLink is a hyperlocal services marketplace (customers find and book nearby plumbers, electricians, tutors, etc.). MERN stack: MongoDB + Express + React + Node.

## Hard constraints — never violate these
- **No TypeScript, anywhere, ever, including new files.** Every file must be `.js` or `.jsx`. If you're about to create a `.ts` or `.tsx` file (including config files), stop and use `.js`/`.jsx` instead.
- Keep MongoDB/Mongoose, Express, React, Vite, Tailwind CSS, React Router, Socket.io, and JWT auth. Do not swap in a different stack.
- Never weaken JWT verification, bcrypt hashing, Zod input validation, or rate limiting.
- The `/supabase` folder is dead, unused scaffolding from the original template — safe to delete, never resurrect it or wire anything to it.

## Structure
- `/server` — Express + Mongoose backend (already plain JS, ES modules)
- `/src` — React frontend (mid-conversion from TypeScript to plain JS — see task plan below)
- `server/routes/`, `server/models/`, `server/middleware/` — backend logic
- `src/pages/customer/`, `src/pages/provider/` — role-specific frontend pages

## Commands
- Frontend: `npm run dev` (root), `npm run build`, `npm run lint`
- Backend: `npm run dev` (inside `/server`), `node seed.js` (inside `/server`) for demo data
- Always run `npm run build` and `npm run lint` in the frontend, and confirm the backend boots with `npm run dev`, before reporting a phase complete.

## How we're working right now
We're executing a multi-phase upgrade described in `locallink-upgrade-plan.md` at the project root: bug fixes → TypeScript-to-JavaScript conversion → project structure cleanup → responsive design pass → new features (reviews, image upload, map search, favorites, notifications, pagination, password reset) → production polish.

Work through it **one phase at a time**, in order. Use plan mode to propose your approach for a phase before editing files. After finishing a phase: run the verification commands above, summarize what changed in a few lines, and stop — don't start the next phase until asked to continue.
