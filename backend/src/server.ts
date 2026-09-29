import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productsRoutes from './routes/products.routes';
import bookingRoutes from './routes/booking.routes';
import ordersRoutes from './routes/orders.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

// Middlewares
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check API
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'D2 LUXURY Furniture API Server',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/products', productsRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/orders', ordersRoutes);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint không tồn tại.',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[D2 LUXURY Server] API đang chạy tại http://localhost:${PORT}`);
});
