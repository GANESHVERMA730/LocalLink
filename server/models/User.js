import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['customer', 'provider'], required: true },
    phone: { type: String, default: '' },
    profileImage: { type: String, default: '' },
  },
  { timestamps: true },
);

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  obj.id = obj._id;
  return obj;
};

export const User = mongoose.model('User', userSchema);
