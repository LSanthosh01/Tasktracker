const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

const app = express();

// CORS Configuration
const normalizeOrigin = (value) => typeof value === 'string' ? value.replace(/\/$/, '') : value;
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.FRONTEND_URL,
  'https://tasktracker-pied.vercel.app'
].map(normalizeOrigin).filter(Boolean);

const isVercelAppOrigin = (origin) => {
  return typeof origin === 'string' && origin.endsWith('.vercel.app');
};

app.use(cors({
  origin: (origin, callback) => {
    const requestedOrigin = normalizeOrigin(origin);
    console.log('CORS request from origin:', requestedOrigin);
    console.log('Allowed origins:', allowedOrigins);
    if (!requestedOrigin || allowedOrigins.includes(requestedOrigin) || isVercelAppOrigin(requestedOrigin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', requestedOrigin);
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('../routes/auth'));
app.use('/auth', require('../routes/auth'));
app.use('/api/users', require('../routes/users'));
app.use('/api/tasks', require('../routes/tasks'));
app.use('/api/reports', require('../routes/reports'));
app.use('/api/ratings', require('../routes/ratings'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'TaskTrack API is running - v2' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// DB + Server start
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI environment variable is required');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Export for Vercel serverless functions
module.exports = app;