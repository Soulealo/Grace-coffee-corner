require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const sanitizeInput = require('./middleware/sanitize');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const userRoutes = require('./routes/users');
const reportRoutes = require('./routes/reports');
const packageRoutes = require('./routes/packages');
const loyaltyRoutes = require('./routes/loyalty');
const shopRoutes = require('./routes/shop');

const app = express();
const port = process.env.PORT || 3000;
const defaultOrigins = [
  `http://localhost:${port}`,
  `http://127.0.0.1:${port}`,
  `http://[::1]:${port}`
];
const allowedOrigins = (process.env.ALLOWED_ORIGINS || defaultOrigins.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInput);

mongoose.set('bufferCommands', false);

function requireDb(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'MongoDB is not connected. Restart the server and refresh the page.'
    });
  }

  return next();
}

app.get('/api/health', async (req, res, next) => {
  try {
    res.json({
      ok: true,
      mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
  } catch (err) {
    next(err);
  }
});

app.use('/api/auth', requireDb, authRoutes);
app.use('/api/bookings', requireDb, bookingRoutes);
app.use('/api/users', requireDb, userRoutes);
app.use('/api/reports', requireDb, reportRoutes);
app.use('/api/packages', requireDb, packageRoutes);
app.use('/api/loyalty', requireDb, loyaltyRoutes);
app.use('/api/shop', requireDb, shopRoutes);

// Short aliases requested by the backend contract.
app.use('/', requireDb, authRoutes);
app.use('/', requireDb, shopRoutes);

app.use(express.static(__dirname, { index: false }));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'landing.html'));
});

app.use(errorHandler);

function connectMongo() {
  mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
      console.log('MongoDB connected');
    })
    .catch((err) => {
      console.error('MongoDB connection failed:', err.message);
      console.error('Check MongoDB settings, then restart the server or run npm start again.');
    });
}

function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('change_this')) {
    console.warn('Warning: set a strong JWT_SECRET in .env.');
  }

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
  connectMongo();
}

if (require.main === module) {
  start();
}

module.exports = app;
