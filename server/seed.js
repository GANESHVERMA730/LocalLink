import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { ProviderProfile } from './models/ProviderProfile.js';
import { Service } from './models/Service.js';
import { Availability } from './models/Availability.js';

// NYC-area coordinates for demo providers
const PROVIDERS = [
  {
    name: 'Mario Rossi',
    email: 'plumber@local.link',
    phone: '+1 555 010 1111',
    bio: 'Licensed master plumber with 15+ years of experience. Specializing in emergency repairs, pipe replacement, and bathroom renovations. Fully insured and available 24/7 for emergencies.',
    address: '456 Atlantic Ave',
    city: 'Brooklyn, NY',
    coordinates: [-73.9903, 40.6834],
    rating: 4.8,
    reviewCount: 27,
    isVerified: true,
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
    phone: '+1 555 020 2222',
    bio: 'Licensed electrician serving Manhattan and Brooklyn. Residential and commercial wiring, panel upgrades, lighting installation, and safety inspections. NEC certified.',
    address: '789 Broadway, Suite 200',
    city: 'New York, NY',
    coordinates: [-73.9916, 40.7233],
    rating: 4.9,
    reviewCount: 41,
    isVerified: true,
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
    phone: '+1 555 030 3333',
    bio: 'Former high school math teacher with a masters in education. SAT/ACT prep, algebra through calculus, and physics tutoring. In-person or online sessions.',
    address: '120 Astoria Blvd',
    city: 'Queens, NY',
    coordinates: [-73.9293, 40.7699],
    rating: 4.7,
    reviewCount: 18,
    isVerified: false,
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
  phone: '+1 555 040 4444',
  role: 'customer',
};

const PASSWORD = 'demo123456';

async function seed() {
  await connectDB();
  console.log('Seeding demo data…');
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

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
        rating: p.rating,
        reviewCount: p.reviewCount,
        isVerified: p.isVerified,
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
    console.log(`  ✓ ${p.name} (${p.email})`);
  }

  let customer = await User.findOne({ email: CUSTOMER.email });
  if (!customer) {
    customer = await User.create({ ...CUSTOMER, passwordHash });
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
