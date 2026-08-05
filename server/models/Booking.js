import mongoose from 'mongoose';

const statusEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      required: true,
    },
    at: { type: Date, required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, default: '' },
  },
  { _id: false },
);

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
    // Append-only. Bookings created before this field existed have an empty
    // array; readers synthesize a first entry from createdAt instead.
    statusHistory: { type: [statusEventSchema], default: [] },
  },
  { timestamps: true },
);

bookingSchema.index({ customer: 1 });
bookingSchema.index({ provider: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);
