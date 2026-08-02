import mongoose from 'mongoose';

const providerProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    bio: { type: String, default: '' },
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

providerProfileSchema.index({ location: '2dsphere' });

export const ProviderProfile = mongoose.model('ProviderProfile', providerProfileSchema);
