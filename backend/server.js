import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import slotRoutes from './routes/slotRoute.js';

import sessionRoutes from './routes/sessionRoute.js';
import authRoutes from './routes/authRoute.js';
import vehicleOwnerRoutes from './routes/vehicleOwnerRoute.js';

const app = express();
app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/vehicle-owners', vehicleOwnerRoutes);
app.use('/api/sessions', sessionRoutes);

app.use('/api/slots', slotRoutes);


const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

io.on('connection', (socket) => {
  console.log('client connected:', socket.id);
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('Mongo connection error:', err));