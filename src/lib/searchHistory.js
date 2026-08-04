const LAST_SEARCH_KEY = 'locallink_last_search';
const RECENT_ADDRESSES_KEY = 'locallink_recent_addresses';
const MAX_RECENT = 5;

function read(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function loadLastSearch() {
  const saved = read(LAST_SEARCH_KEY, null);
  if (!saved || typeof saved.lat !== 'number' || typeof saved.lng !== 'number') return null;
  return saved;
}

export function saveLastSearch(params) {
  localStorage.setItem(LAST_SEARCH_KEY, JSON.stringify(params));
}

export function loadRecentAddresses() {
  const saved = read(RECENT_ADDRESSES_KEY, []);
  return Array.isArray(saved) ? saved : [];
}

export function pushRecentAddress(place) {
  if (!place?.label) return;
  const existing = loadRecentAddresses().filter((p) => p.label !== place.label);
  const next = [place, ...existing].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_ADDRESSES_KEY, JSON.stringify(next));
}
