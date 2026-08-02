import { Router } from 'express';
import { z } from 'zod';
import { Booking } from '../models/Booking.js';
import { Message } from '../models/Message.js';
import { auth } from '../middleware/auth.js';

const router = Router();

const createSchema = z.object({
  providerId: z.string(),
  serviceId: z.string(),
  scheduledAt: z.string().or(z.date()),
  durationMinutes: z.number().int().min(1).optional().default(60),
  customerNotes: z.string().max(2000).optional().default(''),
});

const statusSchema = z.object({
  status: z.enum(['accepted', 'rejected', 'completed', 'cancelled']),
  providerNotes: z.string().max(2000).optional(),
});

const ALLOWED_TRANSITIONS = {
  pending: ['accepted', 'rejected', 'cancelled'],
  accepted: ['completed', 'cancelled'],
  rejected: [],
  completed: [],
  cancelled: [],
};

// List bookings for current user
router.get('/', auth, async (req, res, next) => {
  try {
    const filter =
      req.user.role === 'customer' ? { customer: req.user._id } : { provider: req.user._id };
    const bookings = await Booking.find(filter)
      .populate('customer', 'name email phone profileImage')
      .populate('provider', 'name email phone profileImage')
      .populate('service', 'title category basePrice priceUnit')
      .sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

// Single booking
router.get('/:id', auth, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name email phone profileImage')
      .populate('provider', 'name email phone profileImage')
      .populate('service', 'title category basePrice priceUnit');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    const userId = req.user._id.toString();
    if (booking.customer._id.toString() !== userId && booking.provider._id.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to view this booking' });
    }
    res.json({ booking });
  } catch (err) {
    next(err);
  }
});

// Create booking (customer)
router.post('/', auth, async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const booking = await Booking.create({
      customer: req.user._id,
      provider: data.providerId,
      service: data.serviceId,
      scheduledAt: new Date(data.scheduledAt),
      durationMinutes: data.durationMinutes,
      customerNotes: data.customerNotes,
      status: 'pending',
    });
    await booking.populate('customer', 'name email phone profileImage');
    await booking.populate('provider', 'name email phone profileImage');
    await booking.populate('service', 'title category basePrice priceUnit');
    res.status(201).json({ booking });
  } catch (err) {
    next(err);
  }
});

// Update booking status (state machine)
router.patch('/:id', auth, async (req, res, next) => {
  try {
    const { status, providerNotes } = statusSchema.parse(req.body);
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const userId = req.user._id.toString();
    const isCustomer = booking.customer.toString() === userId;
    const isProvider = booking.provider.toString() === userId;
    if (!isCustomer && !isProvider) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const current = booking.status;
    const allowed = ALLOWED_TRANSITIONS[current] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Cannot transition from ${current} to ${status}` });
    }

    // Role-based transition checks
    if (status === 'accepted' || status === 'rejected') {
      if (!isProvider) return res.status(403).json({ error: 'Only the provider can accept or reject' });
    }

    booking.status = status;
    if (providerNotes !== undefined) booking.providerNotes = providerNotes;
    await booking.save();
    await booking.populate('customer', 'name email phone profileImage');
    await booking.populate('provider', 'name email phone profileImage');
    await booking.populate('service', 'title category basePrice priceUnit');

    // Emit Socket.io event
    req.io.to(`booking:${booking._id}`).emit('booking:updated', { booking });

    res.json({ booking });
  } catch (err) {
    next(err);
  }
});

// Message history for a booking
router.get('/:id/messages', auth, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    const userId = req.user._id.toString();
    if (booking.customer.toString() !== userId && booking.provider.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const messages = await Message.find({ booking: booking._id })
      .populate('sender', 'name profileImage')
      .sort({ createdAt: 1 });
    res.json({ messages });
  } catch (err) {
    next(err);
  }
});

export default router;
