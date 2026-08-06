import { Router } from 'express';
import { Notification } from '../models/Notification.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Get user's notifications (paginated, newest first)
router.get('/', auth, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const skip = Math.max(Number(req.query.skip) || 0, 0);

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip),
      Notification.countDocuments({ user: req.user._id, read: false }),
    ]);

    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
});

// Get unread count only
router.get('/unread-count', auth, async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

// Mark notification as read
router.patch('/:id/read', auth, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true },
    );
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json({ notification });
  } catch (err) {
    next(err);
  }
});

// Mark all notifications as read
router.post('/mark-all-read', auth, async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
