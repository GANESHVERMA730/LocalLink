import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { User } from '../models/User.js';
import { ProviderProfile } from '../models/ProviderProfile.js';
import { Service } from '../models/Service.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = Router();

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  phone: z.string().max(30).optional(),
  profileImage: z.string().optional().or(z.literal('')),
});

const favoriteSchema = z.object({
  providerId: z.string().refine((v) => mongoose.isValidObjectId(v), 'Invalid provider id'),
});

router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

router.patch('/me', auth, async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    Object.assign(req.user, data);
    await req.user.save();
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
});

// Saved providers, hydrated into the same shape the search results use so the
// customer-facing ProviderCard renders them without a second code path.
router.get('/me/favorites', auth, requireRole('customer'), async (req, res, next) => {
  try {
    const ids = req.user.favorites ?? [];
    if (ids.length === 0) return res.json({ providers: [] });

    const [profiles, services] = await Promise.all([
      ProviderProfile.find({ user: { $in: ids } }).populate('user', 'name email profileImage'),
      Service.find({ provider: { $in: ids }, isActive: true }),
    ]);

    const servicesByProvider = new Map();
    services.forEach((s) => {
      const key = s.provider.toString();
      if (!servicesByProvider.has(key)) servicesByProvider.set(key, []);
      servicesByProvider.get(key).push(s);
    });

    // Preserve the order the customer saved them in, newest first.
    const byUserId = new Map(profiles.map((p) => [p.user._id.toString(), p]));
    const providers = ids
      .map((id) => byUserId.get(id.toString()))
      .filter(Boolean)
      .map((p) => ({ ...p.toObject(), services: servicesByProvider.get(p.user._id.toString()) ?? [] }))
      .reverse();

    res.json({ providers });
  } catch (err) {
    next(err);
  }
});

// Idempotent: saving an already-saved provider succeeds rather than 409ing, so
// an optimistic client that retries never has to unwind its own state.
router.post('/me/favorites', auth, requireRole('customer'), async (req, res, next) => {
  try {
    const { providerId } = favoriteSchema.parse(req.body);
    const target = await User.findById(providerId).select('role');
    if (!target) return res.status(404).json({ error: 'Provider not found' });
    if (target.role !== 'provider') {
      return res.status(400).json({ error: 'Only providers can be saved' });
    }
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { favorites: target._id } },
      { new: true },
    ).select('favorites');
    res.json({ favorites: updated.favorites });
  } catch (err) {
    next(err);
  }
});

router.delete('/me/favorites/:providerId', auth, requireRole('customer'), async (req, res, next) => {
  try {
    const { providerId } = favoriteSchema.parse({ providerId: req.params.providerId });
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { favorites: providerId } },
      { new: true },
    ).select('favorites');
    res.json({ favorites: updated.favorites });
  } catch (err) {
    next(err);
  }
});

export default router;
