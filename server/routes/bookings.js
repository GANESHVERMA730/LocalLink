import { Router } from 'express';
import { z } from 'zod';
import { Booking } from '../models/Booking.js';
import { Message } from '../models/Message.js';
import { Notification } from '../models/Notification.js';
import { auth, requireRole } from '../middleware/auth.js';

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

// Which role may make each move. Transition legality and authorization live in
// one table on purpose: a new transition cannot be added without also declaring
// who is allowed to make it.
const TRANSITIONS = {
  pending: { accepted: 'provider', rejected: 'provider', cancelled: 'customer' },
  accepted: { completed: 'provider', cancelled: 'provider' },
  rejected: {},
  completed: {},
  cancelled: {},
};

const ACTOR_LABEL = {
  accepted: 'accept',
  rejected: 'reject',
  completed: 'complete',
  cancelled: 'cancel',
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
      .populate('service', 'title category basePrice priceUnit')
      .populate('statusHistory.by', 'name');
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

async function createNotification(io, userId, data) {
  try {
    const notification = await Notification.create({ user: userId, ...data });
    io.to(`user:${userId}`).emit('notification:new', { notification });
    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

// Create booking (customer)
router.post('/', auth, requireRole('customer'), async (req, res, next) => {
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
      statusHistory: [{ status: 'pending', at: new Date(), by: req.user._id }],
    });
    await booking.populate('customer', 'name email phone profileImage');
    await booking.populate('provider', 'name email phone profileImage');
    await booking.populate('service', 'title category basePrice priceUnit');

    // Notify provider of new booking request
    createNotification(req.io, data.providerId, {
      type: 'booking_created',
      title: 'New booking request',
      message: `${booking.customer.name} requested "${booking.service.title}"`,
      link: `/dashboard/bookings/${booking._id}`,
      relatedId: booking._id,
    });

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
    const requiredRole = TRANSITIONS[current]?.[status];
    if (!requiredRole) {
      return res
        .status(409)
        .json({ error: `Cannot change a ${current} booking to ${status}` });
    }

    const actingAs = isCustomer ? 'customer' : 'provider';
    if (actingAs !== requiredRole) {
      return res
        .status(403)
        .json({ error: `Only the ${requiredRole} can ${ACTOR_LABEL[status]} this booking` });
    }

    booking.status = status;
    if (providerNotes !== undefined) booking.providerNotes = providerNotes;
    booking.statusHistory.push({ status, at: new Date(), by: req.user._id });
    await booking.save();
    await booking.populate('customer', 'name email phone profileImage');
    await booking.populate('provider', 'name email phone profileImage');
    await booking.populate('service', 'title category basePrice priceUnit');
    await booking.populate('statusHistory.by', 'name');

    // Emit Socket.io event
    req.io.to(`booking:${booking._id}`).emit('booking:updated', { booking });

    // Notify the other party
    const serviceName = booking.service?.title ?? 'service';
    const notifyUserId = actingAs === 'provider'
      ? booking.customer._id.toString()
      : booking.provider._id.toString();
    const notifyName = actingAs === 'provider' ? booking.provider.name : booking.customer.name;

    const notifMap = {
      accepted: { type: 'booking_accepted', title: 'Booking accepted', message: `${notifyName} accepted your booking for "${serviceName}"` },
      rejected: { type: 'booking_rejected', title: 'Booking rejected', message: `${notifyName} declined your booking for "${serviceName}"` },
      completed: { type: 'booking_completed', title: 'Booking completed', message: `Your booking for "${serviceName}" has been marked complete` },
      cancelled: { type: 'booking_cancelled', title: 'Booking cancelled', message: `Your booking for "${serviceName}" was cancelled` },
    };
    if (notifMap[status]) {
      createNotification(req.io, notifyUserId, {
        ...notifMap[status],
        link: `/dashboard/bookings/${booking._id}`,
        relatedId: booking._id,
      });
    }

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
