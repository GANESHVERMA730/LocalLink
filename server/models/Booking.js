import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60, min: 1 },
    customerNotes: { type: String, default: '' },
    providerNotes: { type: String, default: '' },
  },
  { timestamps: true },
);

bookingSchema.index({ customer: 1 });
bookingSchema.index({ provider: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);
