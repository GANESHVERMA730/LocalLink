import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { ProviderProfile } from './models/ProviderProfile.js';
import { Service } from './models/Service.js';
import { Availability } from './models/Availability.js';
import { Booking } from './models/Booking.js';
import { Review, recomputeProviderRating } from './models/Review.js';
import { Notification } from './models/Notification.js';
import { Message } from './models/Message.js';

const DEMO_EMAILS = [
  'customer.demo1@locallink.test',
  'customer.demo2@locallink.test',
  'provider.plumber@locallink.test',
  'provider.electrician@locallink.test',
  'provider.tutor@locallink.test',
  'provider.cleaner@locallink.test',
  'provider.carpenter@locallink.test',
];

const LEGACY_DEMO_EMAILS = ['provider.painter@locallink.test'];

const PASSWORD = 'Demo@12345';
const PRESERVED_PROVIDER_EMAIL = 'bikykumar771@gmail.com';

async function upsertUser(fields) {
  const existing = await User.findOne({ email: fields.email });
  if (existing) {
    existing.name = fields.name;
    existing.passwordHash = fields.passwordHash;
    existing.role = fields.role;
    existing.phone = fields.phone;
    existing.profileImage = fields.profileImage ?? '';
    existing.favorites = fields.favorites ?? [];
    await existing.save();
    return existing;
  }
  return User.create(fields);
}

async function removeUsersAndRelated(emails) {
  const users = await User.find({ email: { $in: emails } });
  if (users.length === 0) return [];
  const ids = users.map((u) => u._id);
  const bookings = await Booking.find({
    $or: [{ customer: { $in: ids } }, { provider: { $in: ids } }],
  });
  const bookingIds = bookings.map((b) => b._id);
  await Message.deleteMany({ booking: { $in: bookingIds } });
  await Review.deleteMany({
    $or: [{ booking: { $in: bookingIds } }, { customer: { $in: ids } }, { provider: { $in: ids } }],
  });
  await Booking.deleteMany({ _id: { $in: bookingIds } });
  await ProviderProfile.deleteMany({ user: { $in: ids } });
  await Service.deleteMany({ provider: { $in: ids } });
  await Availability.deleteMany({ provider: { $in: ids } });
  await Notification.deleteMany({
    $or: [{ user: { $in: ids } }, { relatedId: { $in: bookingIds } }],
  });
  await User.updateMany({ favorites: { $in: ids } }, { $pull: { favorites: { $in: ids } } });
  return ids;
}

async function setAvailability(providerId, days, startTime, endTime) {
  for (const dayOfWeek of days) {
    await Availability.create({ provider: providerId, dayOfWeek, startTime, endTime });
  }
}

async function seed() {
  await connectDB();
  console.log('Starting idempotent demo data seeding...');
  console.log(`Database: ${mongoose.connection.name}`);

  console.log('Removing previous demo-owned records (demo emails only)...');
  const demoIds = await removeUsersAndRelated([...DEMO_EMAILS, ...LEGACY_DEMO_EMAILS]);
  await User.deleteMany({ email: { $in: LEGACY_DEMO_EMAILS } });
  if (demoIds.length) {
    console.log(`Cleared related records for ${demoIds.length} previous demo/legacy users.`);
  }

  const preservedProvider = await User.findOne({ email: PRESERVED_PROVIDER_EMAIL });
  if (!preservedProvider) {
    console.log(`WARNING: Preserved provider (${PRESERVED_PROVIDER_EMAIL}) not found.`);
  } else {
    console.log(`Preserved provider (${PRESERVED_PROVIDER_EMAIL}) id=${preservedProvider._id}`);
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const customer1 = await upsertUser({
    name: 'Demo Customer',
    email: 'customer.demo1@locallink.test',
    passwordHash,
    role: 'customer',
    phone: '+91 98765 01111',
    profileImage: '',
  });

  const customer2 = await upsertUser({
    name: 'Rahul Sharma',
    email: 'customer.demo2@locallink.test',
    passwordHash,
    role: 'customer',
    phone: '+91 98765 02222',
    profileImage: '',
  });

  const pPlumber = await upsertUser({
    name: 'Rajesh Kumar',
    email: 'provider.plumber@locallink.test',
    passwordHash,
    role: 'provider',
    phone: '+91 98765 03111',
    profileImage: '',
  });

  const pElectrician = await upsertUser({
    name: 'Amit Verma',
    email: 'provider.electrician@locallink.test',
    passwordHash,
    role: 'provider',
    phone: '+91 98765 03222',
    profileImage: '',
  });

  const pTutor = await upsertUser({
    name: 'Priya Sharma',
    email: 'provider.tutor@locallink.test',
    passwordHash,
    role: 'provider',
    phone: '+91 98765 03333',
    profileImage: '',
  });

  const pCleaner = await upsertUser({
    name: 'Neha Singh',
    email: 'provider.cleaner@locallink.test',
    passwordHash,
    role: 'provider',
    phone: '+91 98765 03444',
    profileImage: '',
  });

  const pCarpenter = await upsertUser({
    name: 'Arjun Patel',
    email: 'provider.carpenter@locallink.test',
    passwordHash,
    role: 'provider',
    phone: '+91 98765 03555',
    profileImage: '',
  });

  const providers = [pPlumber, pElectrician, pTutor, pCleaner, pCarpenter];

  await ProviderProfile.create({
    user: pPlumber._id,
    bio: 'Licensed plumber for leak repair, bathroom fittings, and kitchen pipe work across Aliganj.',
    address: 'Sector C, Aliganj',
    city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.9462, 26.8925] },
    isVerified: true,
    yearsExperience: 10,
    responseTimeMinutes: 15,
  });

  await ProviderProfile.create({
    user: pElectrician._id,
    bio: 'Home electrician for wiring, fans, lights, and appliance circuits in Gomti Nagar.',
    address: 'Vibhuti Khand, Gomti Nagar',
    city: 'Lucknow',
    location: { type: 'Point', coordinates: [81.023, 26.851] },
    isVerified: true,
    yearsExperience: 8,
    responseTimeMinutes: 60,
  });

  await ProviderProfile.create({
    user: pTutor._id,
    bio: 'School and college tutor for mathematics and computer science. Patient, structured lessons.',
    address: 'Sector 14, Indira Nagar',
    city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.995, 26.876] },
    isVerified: true,
    yearsExperience: 7,
    responseTimeMinutes: 60,
  });

  await ProviderProfile.create({
    user: pCleaner._id,
    bio: 'Home and kitchen deep cleaning with eco-friendly supplies. Reliable same-week slots.',
    address: 'Hazratganj Market, Hazratganj',
    city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.943, 26.85] },
    isVerified: true,
    yearsExperience: 5,
    responseTimeMinutes: 15,
  });

  await ProviderProfile.create({
    user: pCarpenter._id,
    bio: 'Furniture repair, door fittings, and custom woodwork for homes in Mahanagar.',
    address: 'Mahanagar Crossing, Mahanagar',
    city: 'Lucknow',
    location: { type: 'Point', coordinates: [80.95, 26.875] },
    isVerified: false,
    yearsExperience: 12,
    responseTimeMinutes: 240,
  });

  const sPlumbRepair = await Service.create({
    provider: pPlumber._id,
    title: 'Plumbing Repair',
    category: 'plumber',
    description: 'Fix leaking taps, blocked drains, and burst pipes.',
    basePrice: 250,
    priceUnit: 'per hour',
    isActive: true,
  });
  const sPlumbBath = await Service.create({
    provider: pPlumber._id,
    title: 'Bathroom Pipe Installation',
    category: 'plumber',
    description: 'Install or replace bathroom supply and waste pipes.',
    basePrice: 1800,
    priceUnit: 'per visit',
    isActive: true,
  });

  const sElecRepair = await Service.create({
    provider: pElectrician._id,
    title: 'Electrical Repair',
    category: 'electrician',
    description: 'Troubleshoot shorts, MCBs, and faulty switches.',
    basePrice: 300,
    priceUnit: 'per visit',
    isActive: true,
  });
  const sElecFan = await Service.create({
    provider: pElectrician._id,
    title: 'Fan & Light Installation',
    category: 'electrician',
    description: 'Install ceiling fans, lights, and new switchboards.',
    basePrice: 400,
    priceUnit: 'per visit',
    isActive: true,
  });

  const sTutorMath = await Service.create({
    provider: pTutor._id,
    title: 'Mathematics Tutoring',
    category: 'tutor',
    description: 'Class 8–12 maths coaching with weekly practice sets.',
    basePrice: 500,
    priceUnit: 'per session',
    isActive: true,
  });
  const sTutorCs = await Service.create({
    provider: pTutor._id,
    title: 'Computer Science Tutoring',
    category: 'tutor',
    description: 'Programming fundamentals, Python, and board-level CS.',
    basePrice: 600,
    priceUnit: 'per session',
    isActive: true,
  });

  const sCleanHome = await Service.create({
    provider: pCleaner._id,
    title: 'Home Deep Cleaning',
    category: 'cleaner',
    description: 'Full-home scrubbing, bathrooms, floors, and dusting.',
    basePrice: 1500,
    priceUnit: 'per visit',
    isActive: true,
  });
  const sCleanKitchen = await Service.create({
    provider: pCleaner._id,
    title: 'Kitchen Cleaning',
    category: 'cleaner',
    description: 'Chimney, counters, tiles, and appliance wipe-down.',
    basePrice: 800,
    priceUnit: 'per visit',
    isActive: true,
  });

  const sCarpFurn = await Service.create({
    provider: pCarpenter._id,
    title: 'Furniture Repair',
    category: 'carpenter',
    description: 'Repair chairs, tables, wardrobes, and loose joints.',
    basePrice: 200,
    priceUnit: 'per hour',
    isActive: true,
  });
  await Service.create({
    provider: pCarpenter._id,
    title: 'Custom Woodwork',
    category: 'carpenter',
    description: 'Shelves, cabinets, and made-to-measure wooden fittings.',
    basePrice: 2500,
    priceUnit: 'per project',
    isActive: true,
  });

  await setAvailability(pPlumber._id, [1, 2, 3, 4, 5], '09:00', '17:00');
  await setAvailability(pElectrician._id, [1, 2, 3, 4, 5, 6], '08:00', '18:00');
  await setAvailability(pTutor._id, [1, 2, 3, 4, 5, 6], '16:00', '20:00');
  await setAvailability(pCleaner._id, [0, 1, 2, 3, 4, 5, 6], '07:00', '19:00');
  await setAvailability(pCarpenter._id, [1, 2, 3, 4, 5, 6], '09:00', '18:00');

  const now = new Date();
  const hours = (h) => new Date(now.getTime() + h * 60 * 60 * 1000);
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  const daysAhead = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  const bCompleted1 = await Booking.create({
    customer: customer1._id,
    provider: pPlumber._id,
    service: sPlumbRepair._id,
    status: 'completed',
    scheduledAt: daysAgo(2),
    durationMinutes: 120,
    customerNotes: 'Kitchen tap leak.',
    providerNotes: 'Replaced washer and tested flow.',
    statusHistory: [
      { status: 'pending', at: daysAgo(3), by: customer1._id },
      { status: 'accepted', at: hours(-70), by: pPlumber._id },
      { status: 'completed', at: daysAgo(2), by: pPlumber._id },
    ],
  });

  const bCompleted2 = await Booking.create({
    customer: customer2._id,
    provider: pCleaner._id,
    service: sCleanHome._id,
    status: 'completed',
    scheduledAt: daysAgo(1),
    durationMinutes: 240,
    customerNotes: 'Need thorough bathroom scrubbing.',
    providerNotes: 'Deep cleaned 2 bathrooms and kitchen.',
    statusHistory: [
      { status: 'pending', at: daysAgo(2), by: customer2._id },
      { status: 'accepted', at: hours(-40), by: pCleaner._id },
      { status: 'completed', at: daysAgo(1), by: pCleaner._id },
    ],
  });

  const bCompleted3 = await Booking.create({
    customer: customer2._id,
    provider: pPlumber._id,
    service: sPlumbBath._id,
    status: 'completed',
    scheduledAt: daysAgo(4),
    durationMinutes: 180,
    customerNotes: 'Replace bathroom supply line.',
    providerNotes: 'New PVC line installed.',
    statusHistory: [
      { status: 'pending', at: daysAgo(5), by: customer2._id },
      { status: 'accepted', at: hours(-110), by: pPlumber._id },
      { status: 'completed', at: daysAgo(4), by: pPlumber._id },
    ],
  });

  const bCompleted4 = await Booking.create({
    customer: customer1._id,
    provider: pTutor._id,
    service: sTutorMath._id,
    status: 'completed',
    scheduledAt: daysAgo(6),
    durationMinutes: 60,
    customerNotes: 'Class 10 algebra revision.',
    providerNotes: 'Covered quadratic equations.',
    statusHistory: [
      { status: 'pending', at: daysAgo(7), by: customer1._id },
      { status: 'accepted', at: hours(-160), by: pTutor._id },
      { status: 'completed', at: daysAgo(6), by: pTutor._id },
    ],
  });

  const bCompleted5 = await Booking.create({
    customer: customer1._id,
    provider: pCarpenter._id,
    service: sCarpFurn._id,
    status: 'completed',
    scheduledAt: daysAgo(8),
    durationMinutes: 90,
    customerNotes: 'Dining chair wobble.',
    providerNotes: 'Reglued joints and tightened screws.',
    statusHistory: [
      { status: 'pending', at: daysAgo(9), by: customer1._id },
      { status: 'accepted', at: hours(-200), by: pCarpenter._id },
      { status: 'completed', at: daysAgo(8), by: pCarpenter._id },
    ],
  });

  const bAccepted1 = await Booking.create({
    customer: customer1._id,
    provider: pElectrician._id,
    service: sElecFan._id,
    status: 'accepted',
    scheduledAt: daysAhead(1),
    durationMinutes: 60,
    customerNotes: 'Need a ceiling fan installed.',
    statusHistory: [
      { status: 'pending', at: daysAgo(1), by: customer1._id },
      { status: 'accepted', at: hours(-20), by: pElectrician._id },
    ],
  });

  const bAccepted2 = await Booking.create({
    customer: customer2._id,
    provider: pTutor._id,
    service: sTutorCs._id,
    status: 'accepted',
    scheduledAt: daysAhead(2),
    durationMinutes: 60,
    customerNotes: 'Python loops and functions.',
    statusHistory: [
      { status: 'pending', at: hours(-12), by: customer2._id },
      { status: 'accepted', at: hours(-10), by: pTutor._id },
    ],
  });

  const bPending1 = await Booking.create({
    customer: customer1._id,
    provider: pCleaner._id,
    service: sCleanKitchen._id,
    status: 'pending',
    scheduledAt: daysAhead(3),
    durationMinutes: 120,
    customerNotes: 'Kitchen chimney and tiles.',
    statusHistory: [{ status: 'pending', at: now, by: customer1._id }],
  });

  const bCancelled1 = await Booking.create({
    customer: customer2._id,
    provider: pElectrician._id,
    service: sElecRepair._id,
    status: 'cancelled',
    scheduledAt: daysAhead(4),
    durationMinutes: 60,
    customerNotes: 'MCB keeps tripping — timing no longer works.',
    statusHistory: [
      { status: 'pending', at: daysAgo(1), by: customer2._id },
      { status: 'cancelled', at: hours(-6), by: customer2._id },
    ],
  });

  await Review.create({
    booking: bCompleted1._id,
    customer: customer1._id,
    provider: pPlumber._id,
    rating: 5,
    comment: 'Arrived on time and fixed the kitchen leak quickly.',
  });
  await Review.create({
    booking: bCompleted2._id,
    customer: customer2._id,
    provider: pCleaner._id,
    rating: 5,
    comment: 'Very thorough deep clean. Highly recommended.',
  });
  await Review.create({
    booking: bCompleted3._id,
    customer: customer2._id,
    provider: pPlumber._id,
    rating: 4,
    comment: 'Neat pipe work. Bathroom is working well now.',
  });
  await Review.create({
    booking: bCompleted4._id,
    customer: customer1._id,
    provider: pTutor._id,
    rating: 5,
    comment: 'Clear explanations. My daughter understood the chapter.',
  });
  await Review.create({
    booking: bCompleted5._id,
    customer: customer1._id,
    provider: pCarpenter._id,
    rating: 3,
    comment: 'Chair is stable now, but the visit took longer than expected.',
  });

  for (const prov of providers) {
    const summary = await recomputeProviderRating(prov._id);
    console.log(`  ${prov.name}: rating=${summary.rating} reviews=${summary.reviewCount}`);
  }

  await User.findByIdAndUpdate(customer1._id, {
    $set: { favorites: [pPlumber._id, pElectrician._id] },
  });
  await User.findByIdAndUpdate(customer2._id, {
    $set: { favorites: [pCleaner._id, pTutor._id] },
  });

  await Message.create({ booking: bAccepted1._id, sender: customer1._id, text: 'Hi, please bring a spare wire.' });
  await Message.create({ booking: bAccepted1._id, sender: pElectrician._id, text: 'Sure, I will bring it with me.' });
  await Message.create({ booking: bCompleted2._id, sender: customer2._id, text: 'Hi, what time will you arrive?' });
  await Message.create({ booking: bCompleted2._id, sender: pCleaner._id, text: 'I will be there by 9 AM.' });

  await Notification.create({
    user: pCleaner._id,
    type: 'booking_created',
    title: 'New booking request',
    message: 'Demo Customer requested "Kitchen Cleaning"',
    link: `/dashboard/bookings/${bPending1._id}`,
    relatedId: bPending1._id,
  });
  await Notification.create({
    user: customer2._id,
    type: 'booking_accepted',
    title: 'Booking accepted',
    message: 'Priya Sharma accepted your booking for "Computer Science Tutoring"',
    link: `/dashboard/bookings/${bAccepted2._id}`,
    relatedId: bAccepted2._id,
  });
  await Notification.create({
    user: pElectrician._id,
    type: 'booking_cancelled',
    title: 'Booking cancelled',
    message: 'Rahul Sharma cancelled "Electrical Repair"',
    link: `/dashboard/bookings/${bCancelled1._id}`,
    relatedId: bCancelled1._id,
  });

  await mongoose.connection.close();
  console.log('Seeding complete. Demo password: Demo@12345');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
