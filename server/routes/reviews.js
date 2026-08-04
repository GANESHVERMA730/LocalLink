import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Review, recomputeProviderRating, summarizeProviderReviews } from '../models/Review.js';
import { Booking } from '../models/Booking.js';
import { auth } from '../middleware/auth.js';

const router = Router();

const createSchema = z.object({
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().default(''),
});

const listSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

// Paginated reviews for a provider, plus the aggregate the UI renders above them.
router.get('/provider/:providerId', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.providerId)) {
      return res.status(400).json({ error: 'Invalid provider id' });
    }
    const { page, limit } = listSchema.parse(req.query);
    const filter = { provider: req.params.providerId };

    const [reviews, total, summary] = await Promise.all([
      Review.find(filter)
        .populate('customer', 'name profileImage')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Review.countDocuments(filter),
      summarizeProviderReviews(req.params.providerId),
    ]);

    res.json({
      reviews,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      total,
      summary,
    });
  } catch (err) {
    next(err);
  }
});

// Whether the signed-in customer may review a given booking (drives the UI prompt).
router.get('/booking/:bookingId', auth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.bookingId)) {
      return res.status(400).json({ error: 'Invalid booking id' });
    }
    const review = await Review.findOne({ booking: req.params.bookingId })
      .populate('customer', 'name profileImage');
    res.json({ review });
  } catch (err) {
    next(err);
  }
});

// Create a review. All three rules — own booking, completed, not yet reviewed —
// are enforced here regardless of what the client sends.
router.post('/', auth, async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    if (!mongoose.isValidObjectId(data.bookingId)) {
      return res.status(400).json({ error: 'Invalid booking id' });
    }

    const booking = await Booking.findById(data.bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the customer on this booking can review it' });
    }
    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'You can only review a completed booking' });
    }
    if (await Review.exists({ booking: booking._id })) {
      return res.status(409).json({ error: 'This booking has already been reviewed' });
    }

    let review;
    try {
      review = await Review.create({
        booking: booking._id,
        customer: booking.customer,
        provider: booking.provider,
        rating: data.rating,
        comment: data.comment,
      });
    } catch (err) {
      // Lost a race against a concurrent submit for the same booking.
      if (err?.code === 11000) {
        return res.status(409).json({ error: 'This booking has already been reviewed' });
      }
      throw err;
    }

    const summary = await recomputeProviderRating(booking.provider);
    await review.populate('customer', 'name profileImage');

    res.status(201).json({ review, summary });
  } catch (err) {
    next(err);
  }
});

export default router;
