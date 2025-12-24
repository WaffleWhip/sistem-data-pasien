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

// Health check - enhanced for Azure Container Apps
app.get('/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
  
  res.json({ 
    status: dbState === 1 ? 'OK' : 'DEGRADED', 
    service: 'main-service',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
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

// Database connection with retry logic for Azure Container Apps
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/main_db';
const seedDoctors = require('./seedDoctors');

const connectWithRetry = async (retries = 10, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[${i + 1}/${retries}] Connecting to MongoDB (Main DB)...`);
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 8000,
      });
      console.log('✅ Connected to MongoDB (Main DB)');
      return true;
    } catch (err) {
      console.error(`❌ Attempt ${i + 1} failed: ${err.message}`);
      if (i < retries - 1) {
        console.log(`⏳ Retry in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start application
const startServer = async () => {
  const connected = await connectWithRetry();
  
  if (!connected) {
    console.error('Failed to connect to MongoDB after multiple retries');
    process.exit(1);
  }
  
  // Seed doctors
  await seedDoctors();
  
  // Start server - bind to 0.0.0.0 for Azure Container Apps
  const PORT = process.env.PORT || 3002;
  const HOST = '0.0.0.0';
  
  app.listen(PORT, HOST, () => {
    console.log(`Main Service running on ${HOST}:${PORT}`);
  });
};

startServer();
