import { io, type Socket } from 'socket.io-client';
import { getToken } from './api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket && socket.connected) return socket;
  const token = getToken();
  if (!token) throw new Error('No auth token for socket');

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });
  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
  socket.on('connect_error', (err) => {
    console.error('Socket connect error:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinBookingRoom(bookingId: string) {
  const s = getSocket();
  s.emit('join:booking', bookingId);
}

export function sendSocketMessage(bookingId: string, text: string): Promise<{ success: boolean; message?: unknown; error?: string }> {
  return new Promise((resolve) => {
    const s = getSocket();
    s.emit('chat:sendMessage', { bookingId, text }, (response: { success: boolean; message?: unknown; error?: string }) => {
      resolve(response);
    });
  });
}

export function onNewMessage(callback: (message: unknown) => void) {
  const s = getSocket();
  s.on('chat:newMessage', callback);
  return () => s.off('chat:newMessage', callback);
}

export function onBookingUpdated(callback: (booking: unknown) => void) {
  const s = getSocket();
  s.on('booking:updated', callback);
  return () => s.off('booking:updated', callback);
}
