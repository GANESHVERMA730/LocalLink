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

// Lucknow-area coordinates for demo providers
const PROVIDERS = [
  {
    name: 'Mario Rossi',
    email: 'plumber@local.link',
    phone: '+91 98765 01111',
    bio: 'Licensed master plumber with 15+ years of experience. Specializing in emergency repairs, pipe replacement, and bathroom renovations. Fully insured and available 24/7 for emergencies.',
    address: '12 Sector B, Aliganj',
    city: 'Lucknow, UP',
    coordinates: [80.9462, 26.8925],
    isVerified: true,
    yearsExperience: 15,
    responseTimeMinutes: 15,
    reviews: [
      { rating: 5, comment: 'Arrived within 40 minutes of my call and had the burst pipe sorted before the floor was ruined. Tidied up afterwards too.' },
      { rating: 5, comment: 'Fair pricing, explained exactly what was wrong instead of just replacing parts. Would book again.' },
      { rating: 4, comment: 'Good work on the bathroom fittings. Ran slightly over the estimated time but the finish is solid.' },
    ],
    services: [
      { title: 'Emergency plumbing repair', category: 'plumber', description: 'Burst pipe, leak, or backup? I will arrive within the hour and fix the issue fast.', basePrice: 120, priceUnit: 'per visit' },
      { title: 'Drain cleaning & unclogging', category: 'plumber', description: 'Professional drain snaking and hydro-jetting for kitchens, bathrooms, and main lines.', basePrice: 90, priceUnit: 'per visit' },
      { title: 'Bathroom fixture installation', category: 'plumber', description: 'Toilet, sink, faucet, or shower installation with all parts included.', basePrice: 75, priceUnit: 'per hour' },
    ],
    availability: [
      { dayOfWeek: 1, startTime: '08:00', endTime: '18:00' },
      { dayOfWeek: 2, startTime: '08:00', endTime: '18:00' },
      { dayOfWeek: 3, startTime: '08:00', endTime: '18:00' },
      { dayOfWeek: 4, startTime: '08:00', endTime: '18:00' },
      { dayOfWeek: 5, startTime: '08:00', endTime: '18:00' },
      { dayOfWeek: 6, startTime: '09:00', endTime: '14:00' },
    ],
  },
  {
    name: 'Sarah Chen',
    email: 'electric@local.link',
    phone: '+91 98765 02222',
    bio: 'Licensed electrician serving Gomti Nagar and central Lucknow. Residential and commercial wiring, panel upgrades, lighting installation, and safety inspections. ISI certified.',
    address: 'Vibhuti Khand, Gomti Nagar',
    city: 'Lucknow, UP',
    coordinates: [81.0064, 26.8570],
    isVerified: true,
    yearsExperience: 9,
    responseTimeMinutes: 60,
    reviews: [
      { rating: 5, comment: 'Full panel inspection with a written safety report. Found two hazards the previous electrician missed.' },
      { rating: 5, comment: 'Installed ceiling fans and smart lighting across the flat. Neat wiring, no mess left behind.' },
    ],
    services: [
      { title: 'Electrical panel inspection', category: 'electrician', description: 'Comprehensive panel inspection with safety report. Identify hazards before they become problems.', basePrice: 150, priceUnit: 'per visit' },
      { title: 'Lighting installation', category: 'electrician', description: 'Recessed lights, chandeliers, ceiling fans, and smart lighting setup.', basePrice: 85, priceUnit: 'per hour' },
      { title: 'Outlet & switch repair', category: 'electrician', description: 'Replace faulty outlets, install GFCI in kitchens and baths, add new circuits.', basePrice: 70, priceUnit: 'per visit' },
    ],
    availability: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
    ],
  },
  {
    name: 'James Okafor',
    email: 'tutor@local.link',
    phone: '+91 98765 03333',
    bio: 'Former high school math teacher with a masters in education. Board exam prep, algebra through calculus, and physics tutoring. In-person or online sessions.',
    address: '5 Ashok Marg, Hazratganj',
    city: 'Lucknow, UP',
    coordinates: [80.9430, 26.8500],
    isVerified: false,
    yearsExperience: 6,
    responseTimeMinutes: 240,
    reviews: [
      { rating: 4, comment: 'Patient with my daughter and genuinely good at breaking down calculus concepts. Her grades moved up a band.' },
    ],
    services: [
      { title: 'SAT/ACT math prep', category: 'tutor', description: 'One-on-one test prep with proven strategies and practice tests. Average score improvement: 180 points.', basePrice: 60, priceUnit: 'per hour' },
      { title: 'Algebra & calculus tutoring', category: 'tutor', description: 'Middle school through AP calculus. Patient, concept-first teaching style.', basePrice: 50, priceUnit: 'per hour' },
      { title: 'Physics tutoring', category: 'tutor', description: 'AP Physics 1 & 2, honors physics, and intro college physics.', basePrice: 55, priceUnit: 'per hour' },
    ],
    availability: [
      { dayOfWeek: 1, startTime: '15:00', endTime: '20:00' },
      { dayOfWeek: 2, startTime: '15:00', endTime: '20:00' },
      { dayOfWeek: 3, startTime: '15:00', endTime: '20:00' },
      { dayOfWeek: 4, startTime: '15:00', endTime: '20:00' },
      { dayOfWeek: 6, startTime: '10:00', endTime: '16:00' },
    ],
  },
];

const CUSTOMER = {
  name: 'Alex Johnson',
  email: 'customer@local.link',
  phone: '+91 98765 04444',
  role: 'customer',
};

const PASSWORD = 'demo123456';

// Fixed anchor so demo bookings land on the same timestamps every run — a relative
// "now" would make the dedup lookup below miss and duplicate reviews on each reseed.
const SEED_EPOCH = Date.parse('2026-08-01T10:00:00.000Z');

async function seed() {
  await connectDB();
  console.log('Seeding demo data…');
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  let customer = await User.findOne({ email: CUSTOMER.email });
  if (!customer) {
    customer = await User.create({ ...CUSTOMER, passwordHash });
  }

  for (const p of PROVIDERS) {
    let user = await User.findOne({ email: p.email });
    if (!user) {
      user = await User.create({ name: p.name, email: p.email, passwordHash, role: 'provider', phone: p.phone });
    }
    let profile = await ProviderProfile.findOne({ user: user._id });
    if (!profile) {
      profile = await ProviderProfile.create({
        user: user._id,
        bio: p.bio,
        address: p.address,
        city: p.city,
        location: { type: 'Point', coordinates: p.coordinates },
        isVerified: p.isVerified,
        yearsExperience: p.yearsExperience,
        responseTimeMinutes: p.responseTimeMinutes,
      });
    }
    for (const s of p.services) {
      const existing = await Service.findOne({ provider: user._id, title: s.title });
      if (!existing) {
        await Service.create({ ...s, provider: user._id });
      }
    }
    for (const a of p.availability) {
      const existing = await Availability.findOne({ provider: user._id, dayOfWeek: a.dayOfWeek, startTime: a.startTime });
      if (!existing) {
        await Availability.create({ ...a, provider: user._id });
      }
    }

    // Demo reviews need real completed bookings behind them, since that is exactly
    // what the review route requires of a live customer.
    const services = await Service.find({ provider: user._id }).sort({ createdAt: 1 });
    for (let i = 0; i < p.reviews.length; i += 1) {
      const service = services[i % services.length];
      if (!service) break;
      const scheduledAt = new Date(SEED_EPOCH - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      let booking = await Booking.findOne({ customer: customer._id, provider: user._id, service: service._id, scheduledAt });
      if (!booking) {
        booking = await Booking.create({
          customer: customer._id,
          provider: user._id,
          service: service._id,
          status: 'completed',
          scheduledAt,
          durationMinutes: 60,
          customerNotes: '',
        });
      }
      const existingReview = await Review.findOne({ booking: booking._id });
      if (!existingReview) {
        await Review.create({
          booking: booking._id,
          customer: customer._id,
          provider: user._id,
          rating: p.reviews[i].rating,
          comment: p.reviews[i].comment,
        });
      }
    }
    await recomputeProviderRating(user._id);

    console.log(`  ✓ ${p.name} (${p.email})`);
  }

  console.log(`  ✓ ${CUSTOMER.name} (${CUSTOMER.email})`);

  await mongoose.connection.close();
  console.log('Seed complete! All passwords: demo123456');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
