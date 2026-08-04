import { api } from './api';

function extract(res, key) {
  if (Array.isArray(res.data)) return res.data;
  return res.data[key] ?? [];
}

function extractOne(res, key) {
  if (res.data && typeof res.data === 'object' && key in res.data) {
    return res.data[key];
  }
  return res.data;
}

// ── Auth ──────────────────────────────────────────────────
export async function registerUser(input) {
  const res = await api.post('/auth/register', input);
  return res.data;
}

export async function loginUser(email, password) {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

// ── Users ─────────────────────────────────────────────────
export async function fetchMe() {
  const res = await api.get('/users/me');
  return extractOne(res, 'user');
}

export async function updateMe(patch) {
  const res = await api.patch('/users/me', patch);
  return extractOne(res, 'user');
}

// ── Geocoding ─────────────────────────────────────────────
export async function geocodeSearch(q, signal) {
  const res = await api.get('/geocode/search', { params: { q }, signal });
  return extract(res, 'results');
}

export async function reverseGeocode(lat, lng) {
  const res = await api.get('/geocode/reverse', { params: { lat, lng } });
  return extractOne(res, 'result');
}

// ── Provider search ───────────────────────────────────────
export async function searchProviders(params) {
  const res = await api.get('/providers/search', { params });
  return extract(res, 'providers');
}

// ── Provider profile ──────────────────────────────────────
export async function fetchProviderProfile(userId) {
  const res = await api.get(`/providers/${userId}`);
  return res.data;
}

export async function fetchMyProviderProfile() {
  const res = await api.get('/providers/me/profile');
  const profile = extractOne(res, 'profile');
  return profile;
}

export async function updateProviderProfile(patch) {
  const res = await api.patch('/providers/me', patch);
  return extractOne(res, 'profile');
}

// ── Services ──────────────────────────────────────────────
export async function fetchMyServices() {
  const res = await api.get('/services');
  return extract(res, 'services');
}

export async function createService(input) {
  const res = await api.post('/services', input);
  return extractOne(res, 'service');
}

export async function updateService(id, patch) {
  const res = await api.patch(`/services/${id}`, patch);
  return extractOne(res, 'service');
}

export async function deleteService(id) {
  await api.delete(`/services/${id}`);
}

// ── Availabilities ────────────────────────────────────────
export async function fetchMyAvailabilities() {
  const res = await api.get('/availabilities/me');
  return extract(res, 'availabilities');
}

export async function fetchAvailabilitiesByProvider(providerId) {
  const res = await api.get(`/availabilities/provider/${providerId}`);
  return extract(res, 'availabilities');
}

export async function createAvailability(input) {
  const res = await api.post('/availabilities', input);
  return extractOne(res, 'availability');
}

export async function deleteAvailability(id) {
  await api.delete(`/availabilities/${id}`);
}

// ── Bookings ──────────────────────────────────────────────
export async function fetchBookings() {
  const res = await api.get('/bookings');
  return extract(res, 'bookings');
}

export async function fetchBooking(id) {
  const res = await api.get(`/bookings/${id}`);
  return extractOne(res, 'booking');
}

export async function createBooking(input) {
  const res = await api.post('/bookings', input);
  return extractOne(res, 'booking');
}

export async function updateBookingStatus(id, status, providerNotes) {
  const res = await api.patch(`/bookings/${id}`, { status, providerNotes });
  return extractOne(res, 'booking');
}

// ── Messages ──────────────────────────────────────────────
export async function fetchMessages(bookingId) {
  const res = await api.get(`/bookings/${bookingId}/messages`);
  return extract(res, 'messages');
}
