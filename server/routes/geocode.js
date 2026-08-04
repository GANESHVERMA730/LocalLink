import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

const router = Router();

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const USER_AGENT = process.env.GEOCODE_USER_AGENT || 'LocalLink/1.0 (hyperlocal services marketplace)';

// Nominatim's usage policy allows at most 1 request per second from a single source.
const MIN_UPSTREAM_INTERVAL_MS = 1100;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;

const geocodeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many location lookups, slow down a moment' },
});

const searchSchema = z.object({
  q: z.string().trim().min(3).max(120),
  limit: z.coerce.number().int().min(1).max(10).optional().default(6),
});

const reverseSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

const cache = new Map();

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key, value) {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, { at: Date.now(), value });
}

// Serializes upstream calls and spaces them out, so concurrent browser requests
// can never burst past Nominatim's rate policy.
let upstreamChain = Promise.resolve();
let lastUpstreamAt = 0;

function callUpstream(path) {
  const run = async () => {
    const wait = lastUpstreamAt + MIN_UPSTREAM_INTERVAL_MS - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastUpstreamAt = Date.now();
    const res = await fetch(`${NOMINATIM}${path}`, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Nominatim responded ${res.status}`);
    return res.json();
  };
  upstreamChain = upstreamChain.then(run, run);
  return upstreamChain;
}

function pickCity(address) {
  if (!address) return '';
  return address.city || address.town || address.village || address.county || address.state || '';
}

function toSuggestion(place) {
  return {
    id: String(place.place_id),
    label: place.display_name,
    lat: Number(place.lat),
    lng: Number(place.lon),
    city: pickCity(place.address),
  };
}

router.get('/search', geocodeLimiter, async (req, res, next) => {
  try {
    const { q, limit } = searchSchema.parse(req.query);
    const key = `s:${q.toLowerCase()}:${limit}`;
    const cached = cacheGet(key);
    if (cached) return res.json({ results: cached, cached: true });

    const params = new URLSearchParams({
      q,
      format: 'jsonv2',
      addressdetails: '1',
      limit: String(limit),
    });
    const data = await callUpstream(`/search?${params}`);
    const results = (Array.isArray(data) ? data : []).map(toSuggestion);
    cacheSet(key, results);
    res.json({ results, cached: false });
  } catch (err) {
    if (err instanceof z.ZodError) return next(err);
    console.error('Geocode search failed:', err.message);
    res.status(503).json({ error: 'Address lookup is unavailable right now. Please try again.' });
  }
});

router.get('/reverse', geocodeLimiter, async (req, res, next) => {
  try {
    const { lat, lng } = reverseSchema.parse(req.query);
    const key = `r:${lat.toFixed(4)}:${lng.toFixed(4)}`;
    const cached = cacheGet(key);
    if (cached) return res.json({ result: cached, cached: true });

    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'jsonv2',
      addressdetails: '1',
    });
    const data = await callUpstream(`/reverse?${params}`);
    const result = data?.display_name
      ? { label: data.display_name, city: pickCity(data.address) }
      : { label: '', city: '' };
    cacheSet(key, result);
    res.json({ result, cached: false });
  } catch (err) {
    if (err instanceof z.ZodError) return next(err);
    console.error('Reverse geocode failed:', err.message);
    res.status(503).json({ error: 'Address lookup is unavailable right now. Please try again.' });
  }
});

export default router;
