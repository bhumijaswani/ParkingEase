// socket.js
import { Server } from 'socket.io';
import { Slot } from './models/Slot.js';
import { toPublicSlot } from './utils/publicSlot.js';

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' },
  });
  io.on('connection', (socket) => {
    console.log('socket connected:', socket.id);
    socket.on('disconnect', (reason) => {
      console.log('socket disconnected:', socket.id, reason);
    });
  });
  return io;
}

async function getSummary() {
  const [total, occupied] = await Promise.all([
    Slot.countDocuments(),
    Slot.countDocuments({ occupancy: 'OCCUPIED' }),
  ]);
  return { total, occupied, free: total - occupied };
}

export async function broadcastSlotChange(slot) {
  if (!io || !slot) return;
  try {
    io.emit('slot:updated', toPublicSlot(slot));
    io.emit('summary:updated', await getSummary());
  } catch (err) {
    console.error('broadcast failed:', err.message);
  }
}