import { Router } from 'express';
import { z } from 'zod';
import { Availability } from '../models/Availability.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = Router();

const availSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isActive: z.boolean().optional().default(true),
});

// Create (provider only)
router.post('/', auth, requireRole('provider'), async (req, res, next) => {
  try {
    const data = availSchema.parse(req.body);
    const avail = await Availability.create({ ...data, provider: req.user._id });
    res.status(201).json({ availability: avail });
  } catch (err) {
    next(err);
  }
});

// List for a provider (public — used on profile page)
router.get('/provider/:providerId', async (req, res, next) => {
  try {
    const avails = await Availability.find({
      provider: req.params.providerId,
      isActive: true,
    }).sort({ dayOfWeek: 1, startTime: 1 });
    res.json({ availabilities: avails });
  } catch (err) {
    next(err);
  }
});

// Update
router.patch('/:id', auth, requireRole('provider'), async (req, res, next) => {
  try {
    const data = availSchema.partial().parse(req.body);
    const avail = await Availability.findOneAndUpdate(
      { _id: req.params.id, provider: req.user._id },
      { $set: data },
      { new: true },
    );
    if (!avail) return res.status(404).json({ error: 'Availability not found' });
    res.json({ availability: avail });
  } catch (err) {
    next(err);
  }
});

// Delete
router.delete('/:id', auth, requireRole('provider'), async (req, res, next) => {
  try {
    const avail = await Availability.findOneAndDelete({ _id: req.params.id, provider: req.user._id });
    if (!avail) return res.status(404).json({ error: 'Availability not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// List own availabilities (provider)
router.get('/me', auth, requireRole('provider'), async (req, res, next) => {
  try {
    const avails = await Availability.find({ provider: req.user._id }).sort({ dayOfWeek: 1, startTime: 1 });
    res.json({ availabilities: avails });
  } catch (err) {
    next(err);
  }
});

export default router;
