import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

messageSchema.index({ booking: 1, createdAt: 1 });

export const Message = mongoose.model('Message', messageSchema);
