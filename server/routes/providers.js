import { Router } from 'express';
import { z } from 'zod';
import { ProviderProfile } from '../models/ProviderProfile.js';
import { Service } from '../models/Service.js';
import { Availability } from '../models/Availability.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = Router();

const profileSchema = z.object({
  bio: z.string().max(2000).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  location: z
    .object({
      type: z.literal('Point'),
      coordinates: z.tuple([z.number(), z.number()]),
    })
    .optional(),
});

// Geospatial + availability search
router.get('/search', async (req, res, next) => {
  try {
    // `dateParam`, not `date` — a variable named `date` here shadows the global `Date`.
    const { lat, lng, maxDistance, category, minRating, date: dateParam } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });

    const pipeline = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          distanceField: 'distance',
          maxDistance: parseInt(maxDistance) || 10000,
          spherical: true,
        },
      },
      {
        // Join on Service.provider rather than a denormalized id array on the
        // profile, so a service is discoverable the moment it is created.
        $lookup: {
          from: 'services',
          let: { providerUserId: '$user' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$provider', '$$providerUserId'] },
                    { $eq: ['$isActive', true] },
                  ],
                },
              },
            },
          ],
          as: 'services',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
          pipeline: [{ $project: { name: 1, email: 1, phone: 1, profileImage: 1 } }],
        },
      },
      { $unwind: '$user' },
    ];

    if (minRating) {
      pipeline.push({ $match: { rating: { $gte: parseFloat(minRating) } } });
    }

    let providers = await ProviderProfile.aggregate(pipeline);

    // Filter by category on the joined services (already limited to active ones)
    if (category) {
      providers = providers
        .filter((p) => p.services.some((s) => s.category === category))
        .map((p) => ({
          ...p,
          services: p.services.filter((s) => s.category === category),
        }));
    }

    // Filter by availability on a date
    if (dateParam) {
      // A bare `YYYY-MM-DD` parses as UTC midnight per spec, but getDay()/getHours()
      // read local time — west of UTC that lands on the previous day. Build the date
      // from its parts so the calendar day the customer picked is the one we match.
      const hasTime = dateParam.includes('T');
      let d;
      if (hasTime) {
        d = new Date(dateParam);
      } else {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateParam);
        if (!match) return res.status(400).json({ error: 'Invalid date' });
        const [, year, month, day] = match.map(Number);
        d = new Date(year, month - 1, day);
        // The Date constructor rolls overflow over (month 13 -> next January), so
        // reject anything that didn't survive the round trip, e.g. 2026-13-45.
        if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
          return res.status(400).json({ error: 'Invalid date' });
        }
      }
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ error: 'Invalid date' });
      }

      // Date-only means "works at all that day"; a full datetime also checks the
      // time window, since then the caller did pick a time of day.
      const availabilityQuery = {
        provider: { $in: providers.map((p) => p.user._id) },
        dayOfWeek: d.getDay(),
        isActive: true,
      };
      if (hasTime) {
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const timeStr = `${hh}:${mm}`;
        availabilityQuery.startTime = { $lte: timeStr };
        availabilityQuery.endTime = { $gt: timeStr };
      }

      const availabilities = await Availability.find(availabilityQuery).distinct('provider');
      const availSet = new Set(availabilities.map((id) => id.toString()));
      providers = providers.filter((p) => availSet.has(p.user._id.toString()));
    }

    res.json({ providers });
  } catch (err) {
    next(err);
  }
});

// Public provider profile + services + availability
router.get('/:id', async (req, res, next) => {
  try {
    const profile = await ProviderProfile.findOne({ user: req.params.id })
      .populate('user', 'name email phone profileImage');
    if (!profile) return res.status(404).json({ error: 'Provider not found' });
    const services = await Service.find({ provider: req.params.id, isActive: true }).sort({ createdAt: -1 });
    const availability = await Availability.find({ provider: req.params.id, isActive: true }).sort({ dayOfWeek: 1, startTime: 1 });
    res.json({ profile: { ...profile.toObject(), services }, availability });
  } catch (err) {
    next(err);
  }
});

// Create provider profile (provider only)
router.post('/', auth, requireRole('provider'), async (req, res, next) => {
  try {
    const data = profileSchema.parse(req.body);
    const existing = await ProviderProfile.findOne({ user: req.user._id });
    if (existing) return res.status(409).json({ error: 'Provider profile already exists' });
    const profile = await ProviderProfile.create({ user: req.user._id, ...data });
    res.status(201).json({ profile });
  } catch (err) {
    next(err);
  }
});

// Update own provider profile
router.patch('/me', auth, requireRole('provider'), async (req, res, next) => {
  try {
    const data = profileSchema.parse(req.body);
    const profile = await ProviderProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: data },
      { new: true, upsert: true },
    );
    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

// Get own provider profile
router.get('/me/profile', auth, requireRole('provider'), async (req, res, next) => {
  try {
    const profile = await ProviderProfile.findOne({ user: req.user._id });
    if (!profile) return res.json({ profile: null });
    const services = await Service.find({ provider: req.user._id }).sort({ createdAt: -1 });
    res.json({ profile: { ...profile.toObject(), services } });
  } catch (err) {
    next(err);
  }
});

export default router;
