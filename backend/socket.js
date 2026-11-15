// socket.js
import { Server } from 'socket.io';
import { toPublicSlot } from './utils/publicSlot.js';
import { getLotSummary } from './services/slotService.js';

let io = null;
const OBJECT_ID = /^[a-f0-9]{24}$/i;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' },
  });

  io.on('connection', (socket) => {
    console.log('socket connected:', socket.id);

    // a screen says which lot it is looking at, and only hears about that lot
    socket.on('lot:join', (lotId) => {
      if (typeof lotId === 'string' && OBJECT_ID.test(lotId)) socket.join(`lot:${lotId}`);
    });
    socket.on('lot:leave', (lotId) => {
      if (typeof lotId === 'string') socket.leave(`lot:${lotId}`);
    });

    socket.on('disconnect', (reason) => {
      console.log('socket disconnected:', socket.id, reason);
    });
  });

  return io;
}

export async function broadcastSlotChange(slot) {
  if (!io || !slot) return;
  try {
    const room = `lot:${slot.lot}`;
    io.to(room).emit('slot:updated', toPublicSlot(slot));
    io.to(room).emit('summary:updated', await getLotSummary(slot.lot));
  } catch (err) {
    console.error('broadcast failed:', err.message);
  }
}