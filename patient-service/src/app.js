const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware - HARUS DULUAN sebelum routes!
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb-patient:27017/patientdb')
  .then(() => console.log('MongoDB connected untuk Patient Service'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes - PASTIKAN PATH BENAR!
const patientRoutes = require('./routes/patient.routes');

// Gunakan routes dengan path yang benar
app.use('/api', patientRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Patient Service',
    timestamp: new Date().toISOString()
  });
});

// 404 handler untuk route yang tidak ditemukan
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan internal server',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

module.exports = app;
