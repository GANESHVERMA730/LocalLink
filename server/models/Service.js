import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: [
        'plumber',
        'electrician',
        'tutor',
        'cleaner',
        'carpenter',
        'painter',
        'mechanic',
        'photographer',
        'fitness',
        'beauty',
        'events',
        'other',
      ],
    },
    description: { type: String, default: '' },
    basePrice: { type: Number, default: 0, min: 0 },
    priceUnit: { type: String, default: 'per visit' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Service = mongoose.model('Service', serviceSchema);
