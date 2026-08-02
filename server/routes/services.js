import { Router } from 'express';
import { z } from 'zod';
import { Service } from '../models/Service.js';
import { ProviderProfile } from '../models/ProviderProfile.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = Router();

const serviceSchema = z.object({
  title: z.string().min(1).max(100),
  category: z.enum([
    'plumber', 'electrician', 'tutor', 'cleaner', 'carpenter', 'painter',
    'mechanic', 'photographer', 'fitness', 'beauty', 'events', 'other',
  ]),
  description: z.string().max(2000).optional().default(''),
  basePrice: z.number().min(0).optional().default(0),
  priceUnit: z.string().max(50).optional().default('per visit'),
  isActive: z.boolean().optional().default(true),
});

// List: own services if provider, all active if customer
router.get('/', auth, async (req, res, next) => {
  try {
    let services;
    if (req.user.role === 'provider') {
      services = await Service.find({ provider: req.user._id }).sort({ createdAt: -1 });
    } else {
      services = await Service.find({ isActive: true }).populate('provider', 'name').sort({ createdAt: -1 });
    }
    res.json({ services });
  } catch (err) {
    next(err);
  }
});

// Create (provider only)
router.post('/', auth, requireRole('provider'), async (req, res, next) => {
  try {
    const data = serviceSchema.parse(req.body);
    const service = await Service.create({ ...data, provider: req.user._id });
    // Add to provider profile
    await ProviderProfile.findOneAndUpdate(
      { user: req.user._id },
      { $addToSet: { services: service._id } },
      { upsert: false },
    );
    res.status(201).json({ service });
  } catch (err) {
    next(err);
  }
});

// Update
router.patch('/:id', auth, requireRole('provider'), async (req, res, next) => {
  try {
    const service = await Service.findOne({ _id: req.params.id, provider: req.user._id });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    const data = serviceSchema.partial().parse(req.body);
    Object.assign(service, data);
    await service.save();
    res.json({ service });
  } catch (err) {
    next(err);
  }
});

// Delete
router.delete('/:id', auth, requireRole('provider'), async (req, res, next) => {
  try {
    const service = await Service.findOneAndDelete({ _id: req.params.id, provider: req.user._id });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    await ProviderProfile.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { services: service._id } },
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
