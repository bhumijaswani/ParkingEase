import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import slotRoutes from './routes/slotRoute.js';
import { releaseExpiredReservations } from './services/bookingService.js';
import { broadcastSlotChange } from './socket.js';
import { initSocket } from './socket.js';

import sessionRoutes from './routes/sessionRoute.js';
import authRoutes from './routes/authRoute.js';
import vehicleOwnerRoutes from './routes/vehicleOwnerRoute.js';
import lotRoutes from './routes/lotRoute.js';
import bookingRoutes from './routes/bookingRoute.js';
const app = express();

const server = http.createServer(app);
initSocket(server);

app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/vehicle-owners', vehicleOwnerRoutes);
app.use('/api/sessions', sessionRoutes);

app.use('/api/slots', slotRoutes);

app.use('/api', lotRoutes);
app.use('/api/bookings', bookingRoutes);
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});


const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    setInterval(async () => {
      try {
        const released = await releaseExpiredReservations();
        for (const slot of released) await broadcastSlotChange(slot);
      } catch (err) {
        console.error('expiry job failed:', err.message);
      }
    }, 60 * 1000);
  })
  .catch((err) => console.error('Mongo connection error:', err));