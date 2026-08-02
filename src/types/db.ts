export type Role = 'customer' | 'provider';

export type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

export interface MongoId {
  _id: string;
}

export interface User extends MongoId {
  name: string;
  email: string;
  role: Role;
  phone: string;
  profileImage: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRef extends MongoId {
  name: string;
  email?: string;
  phone?: string;
  profileImage?: string;
}

export interface ProviderProfile extends MongoId {
  user: UserRef | string;
  bio: string;
  services: (Service | string)[];
  location: { type: 'Point'; coordinates: [number, number] };
  address: string;
  city: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Service extends MongoId {
  provider: string;
  title: string;
  category: string;
  description: string;
  basePrice: number;
  priceUnit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Availability extends MongoId {
  provider: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Booking extends MongoId {
  customer: UserRef | string;
  provider: UserRef | string;
  service: Service | string;
  status: BookingStatus;
  scheduledAt: string;
  durationMinutes: number;
  customerNotes: string;
  providerNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingWithDetails extends MongoId {
  customer: UserRef;
  provider: UserRef;
  service: Pick<Service, '_id' | 'title' | 'category' | 'basePrice' | 'priceUnit'>;
  status: BookingStatus;
  scheduledAt: string;
  durationMinutes: number;
  customerNotes: string;
  providerNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message extends MongoId {
  booking: string;
  sender: UserRef | string;
  text: string;
  createdAt: string;
}

export interface MessageWithSender extends MongoId {
  booking: string;
  sender: UserRef;
  text: string;
  createdAt: string;
}

export interface SearchResultProvider {
  _id: string;
  user: UserRef;
  bio: string;
  address: string;
  city: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  distance: number;
  services: Service[];
}

export const SERVICE_CATEGORIES: { value: string; label: string; icon: string }[] = [
  { value: 'plumber', label: 'Plumber', icon: 'Wrench' },
  { value: 'electrician', label: 'Electrician', icon: 'Zap' },
  { value: 'tutor', label: 'Tutor', icon: 'GraduationCap' },
  { value: 'cleaner', label: 'Cleaner', icon: 'Sparkles' },
  { value: 'carpenter', label: 'Carpenter', icon: 'Hammer' },
  { value: 'painter', label: 'Painter', icon: 'PaintRoller' },
  { value: 'mechanic', label: 'Mechanic', icon: 'Car' },
  { value: 'photographer', label: 'Photographer', icon: 'Camera' },
  { value: 'fitness', label: 'Fitness', icon: 'Dumbbell' },
  { value: 'beauty', label: 'Beauty', icon: 'Scissors' },
  { value: 'events', label: 'Events', icon: 'PartyPopper' },
  { value: 'other', label: 'Other', icon: 'Briefcase' },
];

export const PRICE_UNITS = ['per hour', 'per visit', 'per project', 'per session', 'fixed'];

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
