import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

availabilitySchema.index({ provider: 1, dayOfWeek: 1 });

export const Availability = mongoose.model('Availability', availabilitySchema);
