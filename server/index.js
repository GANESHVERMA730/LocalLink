import 'dotenv/config';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import providerRoutes from './routes/providers.js';
import serviceRoutes from './routes/services.js';
import availabilityRoutes from './routes/availabilities.js';
import bookingRoutes from './routes/bookings.js';
import geocodeRoutes from './routes/geocode.js';
import reviewRoutes from './routes/reviews.js';
import notificationRoutes from './routes/notifications.js';
import uploadRoutes from './routes/uploads.js';
import passwordResetRoutes from './routes/passwordReset.js';
import { Message } from './models/Message.js';
import { Booking } from './models/Booking.js';
import { Notification } from './models/Notification.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  },
});

// Make io accessible in routes via req.io
app.use((req, _res, next) => {
  req.io = io;
  next();
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordResetRoutes);
app.use('/api/users', userRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/availabilities', availabilityRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/uploads', uploadRoutes);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

// ─── Socket.io ───────────────────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    console.error('Socket handshake rejected:', err.message);
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.user.id}`);

  // Join personal user room for notifications
  socket.join(`user:${socket.user.id}`);

  // Join a booking room
  socket.on('join:booking', async (bookingId) => {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) return;
      const uid = socket.user.id;
      if (booking.customer.toString() === uid || booking.provider.toString() === uid) {
        socket.join(`booking:${bookingId}`);
      }
    } catch (e) {
      console.error(`join:booking failed for booking ${bookingId}:`, e);
    }
  });

  // Send a chat message
  socket.on('chat:sendMessage', async ({ bookingId, text }, callback) => {
    try {
      if (!text || !text.trim()) return;
      const booking = await Booking.findById(bookingId);
      if (!booking) return;
      const uid = socket.user.id;
      if (booking.customer.toString() !== uid && booking.provider.toString() !== uid) {
        return;
      }
      const message = await Message.create({ booking: bookingId, sender: uid, text: text.trim() });
      await message.populate('sender', 'name profileImage');
      const payload = {
        id: message._id,
        booking: bookingId,
        sender: message.sender,
        text: message.text,
        createdAt: message.createdAt,
      };
      io.to(`booking:${bookingId}`).emit('chat:newMessage', payload);
      if (callback) callback({ success: true, message: payload });

      // Notify the other participant if they're not actively in the room
      const recipientId = booking.customer.toString() === uid
        ? booking.provider.toString()
        : booking.customer.toString();
      try {
        const notif = await Notification.create({
          user: recipientId,
          type: 'new_message',
          title: 'New message',
          message: `${message.sender.name} sent you a message`,
          link: `/dashboard/bookings/${bookingId}`,
          relatedId: bookingId,
        });
        io.to(`user:${recipientId}`).emit('notification:new', { notification: notif });
      } catch (e) {
        console.error('Failed to create message notification:', e);
      }
    } catch (e) {
      console.error(`chat:sendMessage failed for booking ${bookingId}:`, e);
      if (callback) callback({ success: false, error: 'Failed to send' });
    }
  });

  // Typing indicator
  socket.on('chat:typing', ({ bookingId, typing }) => {
    socket.to(`booking:${bookingId}`).emit('chat:typing', { userId: socket.user.id, typing });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.user.id}`);
  });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`LocalLink server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
