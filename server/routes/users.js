import { Router } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth.js';

const router = Router();

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  phone: z.string().max(30).optional(),
  profileImage: z.string().url().optional().or(z.literal('')),
});

router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

router.patch('/me', auth, async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    Object.assign(req.user, data);
    await req.user.save();
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
});

export default router;
