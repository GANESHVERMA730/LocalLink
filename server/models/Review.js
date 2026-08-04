import mongoose from 'mongoose';
import { ProviderProfile } from './ProviderProfile.js';

const reviewSchema = new mongoose.Schema(
  {
    // Unique: the "one review per booking" rule is enforced by the index, not just
    // the route check, so two concurrent submits can't both slip through.
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', maxlength: 1000 },
  },
  { timestamps: true },
);

reviewSchema.index({ provider: 1, createdAt: -1 });

export const Review = mongoose.model('Review', reviewSchema);

export async function summarizeProviderReviews(providerUserId) {
  const providerId = new mongoose.Types.ObjectId(String(providerUserId));
  const rows = await Review.aggregate([
    { $match: { provider: providerId } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let sum = 0;
  for (const row of rows) {
    breakdown[row._id] = row.count;
    total += row.count;
    sum += row._id * row.count;
  }
  const rating = total ? Math.round((sum / total) * 10) / 10 : 0;
  return { rating, reviewCount: total, breakdown };
}

export async function recomputeProviderRating(providerUserId) {
  const { rating, reviewCount, breakdown } = await summarizeProviderReviews(providerUserId);
  await ProviderProfile.findOneAndUpdate(
    { user: providerUserId },
    { $set: { rating, reviewCount } },
  );
  return { rating, reviewCount, breakdown };
}
