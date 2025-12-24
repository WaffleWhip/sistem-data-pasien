require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const visitRoutes = require('./routes/visitRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'main-service' });
});

// Stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const Patient = require('./models/Patient');
    const Doctor = require('./models/Doctor');
    
    const totalPatients = await Patient.countDocuments();
    const totalDoctors = await Doctor.countDocuments({ isActive: true });
    
    res.json({
      success: true,
      data: {
        totalPatients,
        totalDoctors
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan'
  });
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/main_db';
const seedDoctors = require('./seedDoctors');

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB (Main DB)');
    
    // Seed doctors
    await seedDoctors();
    
    // Start server
    const PORT = process.env.PORT || 3002;
    app.listen(PORT, () => {
      console.log(`Main Service running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
