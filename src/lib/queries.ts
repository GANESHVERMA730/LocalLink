import { api } from './api';
import type {
  Availability,
  BookingWithDetails,
  MessageWithSender,
  ProviderProfile,
  SearchResultProvider,
  Service,
  User,
} from '@/types/db';

function extract<T>(res: { data: { [key: string]: T } | T[] }, key: string): T[] {
  if (Array.isArray(res.data)) return res.data;
  return (res.data as Record<string, T[]>)[key] ?? [];
}

function extractOne<T>(res: { data: { [key: string]: T } | T }, key: string): T {
  if (res.data && typeof res.data === 'object' && key in (res.data as Record<string, T>)) {
    return (res.data as Record<string, T>)[key];
  }
  return res.data as T;
}

// ── Auth ──────────────────────────────────────────────────
export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  role: 'customer' | 'provider';
  phone?: string;
}): Promise<{ token: string; user: User }> {
  const res = await api.post('/auth/register', input);
  return res.data;
}

export async function loginUser(email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

// ── Users ─────────────────────────────────────────────────
export async function fetchMe(): Promise<User> {
  const res = await api.get('/users/me');
  return extractOne<User>(res, 'user');
}

export async function updateMe(patch: { name?: string; phone?: string; profileImage?: string }): Promise<User> {
  const res = await api.patch('/users/me', patch);
  return extractOne<User>(res, 'user');
}

// ── Provider search ───────────────────────────────────────
export async function searchProviders(params: {
  lat: number;
  lng: number;
  maxDistance?: number;
  category?: string;
  minRating?: number;
  date?: string;
}): Promise<SearchResultProvider[]> {
  const res = await api.get('/providers/search', { params });
  return extract<SearchResultProvider>(res, 'providers');
}

// ── Provider profile ──────────────────────────────────────
export async function fetchProviderProfile(userId: string): Promise<{ profile: ProviderProfile & { user: User }; availability: Availability[] }> {
  const res = await api.get(`/providers/${userId}`);
  return res.data;
}

export async function fetchMyProviderProfile(): Promise<ProviderProfile | null> {
  const res = await api.get('/providers/me/profile');
  const profile = extractOne<ProviderProfile | null>(res, 'profile');
  return profile;
}

export async function updateProviderProfile(patch: {
  bio?: string;
  address?: string;
  city?: string;
  location?: { type: 'Point'; coordinates: [number, number] };
}): Promise<ProviderProfile> {
  const res = await api.patch('/providers/me', patch);
  return extractOne<ProviderProfile>(res, 'profile');
}

// ── Services ──────────────────────────────────────────────
export async function fetchMyServices(): Promise<Service[]> {
  const res = await api.get('/services');
  return extract<Service>(res, 'services');
}

export async function createService(input: {
  title: string;
  category: string;
  description?: string;
  basePrice?: number;
  priceUnit?: string;
  isActive?: boolean;
}): Promise<Service> {
  const res = await api.post('/services', input);
  return extractOne<Service>(res, 'service');
}

export async function updateService(id: string, patch: Partial<Pick<Service, 'title' | 'category' | 'description' | 'basePrice' | 'priceUnit' | 'isActive'>>): Promise<Service> {
  const res = await api.patch(`/services/${id}`, patch);
  return extractOne<Service>(res, 'service');
}

export async function deleteService(id: string): Promise<void> {
  await api.delete(`/services/${id}`);
}

// ── Availabilities ────────────────────────────────────────
export async function fetchMyAvailabilities(): Promise<Availability[]> {
  const res = await api.get('/availabilities/me');
  return extract<Availability>(res, 'availabilities');
}

export async function fetchAvailabilitiesByProvider(providerId: string): Promise<Availability[]> {
  const res = await api.get(`/availabilities/provider/${providerId}`);
  return extract<Availability>(res, 'availabilities');
}

export async function createAvailability(input: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}): Promise<Availability> {
  const res = await api.post('/availabilities', input);
  return extractOne<Availability>(res, 'availability');
}

export async function deleteAvailability(id: string): Promise<void> {
  await api.delete(`/availabilities/${id}`);
}

// ── Bookings ──────────────────────────────────────────────
export async function fetchBookings(): Promise<BookingWithDetails[]> {
  const res = await api.get('/bookings');
  return extract<BookingWithDetails>(res, 'bookings');
}

export async function fetchBooking(id: string): Promise<BookingWithDetails> {
  const res = await api.get(`/bookings/${id}`);
  return extractOne<BookingWithDetails>(res, 'booking');
}

export async function createBooking(input: {
  providerId: string;
  serviceId: string;
  scheduledAt: string;
  durationMinutes?: number;
  customerNotes?: string;
}): Promise<BookingWithDetails> {
  const res = await api.post('/bookings', input);
  return extractOne<BookingWithDetails>(res, 'booking');
}

export async function updateBookingStatus(id: string, status: string, providerNotes?: string): Promise<BookingWithDetails> {
  const res = await api.patch(`/bookings/${id}`, { status, providerNotes });
  return extractOne<BookingWithDetails>(res, 'booking');
}

// ── Messages ──────────────────────────────────────────────
export async function fetchMessages(bookingId: string): Promise<MessageWithSender[]> {
  const res = await api.get(`/bookings/${bookingId}/messages`);
  return extract<MessageWithSender>(res, 'messages');
}
