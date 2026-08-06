import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User.js';

const router = Router();

const resetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { error: 'Too many requests, try again later' } });

const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6).max(100),
});

async function createTransporter() {
  // Development: auto-generated Ethereal test account (no signup required).
  // Production: swap this block for real provider config, e.g.:
  //   return nodemailer.createTransport({
  //     service: 'SendGrid',
  //     auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  //   });
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

router.post('/forgot-password', resetLimiter, async (req, res, next) => {
  try {
    const { email } = forgotSchema.parse(req.body);
    const user = await User.findOne({ email });

    // Always 200 — don't leak whether the email exists
    if (!user) return res.json({ message: 'If that email is registered, a reset link has been sent.' });

    const token = jwt.sign(
      { id: user._id, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    try {
      const transporter = await createTransporter();
      const info = await transporter.sendMail({
        from: '"LocalLink" <noreply@locallink.app>',
        to: email,
        subject: 'Reset your LocalLink password',
        text: `You requested a password reset.\n\nClick the link below (valid for 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
        html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset my password</a></p><p>Link valid for 1 hour. If you didn't request this, ignore this email.</p>`,
      });
      // In development, log the Ethereal preview URL so you can see the email without a real inbox
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) console.log(`Password reset email preview: ${preview}`);
    } catch (emailErr) {
      console.error('Failed to send reset email:', emailErr);
      // Still respond with success so the user isn't stuck; log the token for dev use
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV] Password reset URL: ${resetUrl}`);
      }
    }

    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
});

router.post('/reset-password', resetLimiter, async (req, res, next) => {
  try {
    const { token, password } = resetSchema.parse(req.body);
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    }

    if (payload.purpose !== 'password-reset') {
      return res.status(400).json({ error: 'Invalid reset token.' });
    }

    const user = await User.findById(payload.id);
    if (!user) return res.status(400).json({ error: 'Account not found.' });

    user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();

    res.json({ message: 'Password updated successfully. You can now sign in.' });
  } catch (err) {
    next(err);
  }
});

export default router;
