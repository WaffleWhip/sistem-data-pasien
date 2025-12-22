require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');
const cors = require('cors');
const helmet = require('helmet');
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 10000; // 10 seconds

const connectDB = async (retries = 0) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doctordb', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(' Doctor Service: MongoDB connected');
  } catch (error) {
    console.error(' MongoDB connection error:', error.message);
    if (retries < MAX_RETRIES) {
      console.log(` Retrying MongoDB connection in ${RETRY_DELAY_MS / 1000} seconds... (Attempt ${retries + 1}/${MAX_RETRIES})`);
      setTimeout(() => connectDB(retries + 1), RETRY_DELAY_MS);
    } else {
      console.error(' Max MongoDB connection retries reached. Exiting.');
      process.exit(1);
    }
  }
};

connectDB();

// Joi validation schema for doctors
const doctorValidationSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  specialty: Joi.string().min(3).max(100).required(),
  phone: Joi.string().pattern(/^[0-9+\-\s()]{10,20}$/).required(),
  email: Joi.string().email().optional().allow('', null),
  isActive: Joi.boolean().default(true)
});

// Doctor Schema
const doctorSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  specialty: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  phone: { 
    type: String, 
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true // Allows multiple documents to have a null/missing email
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

doctorSchema.index({ name: 1 });
doctorSchema.index({ specialty: 1 });

const Doctor = mongoose.model('Doctor', doctorSchema);

// Middleware to extract user info and check for admin role
const isAdmin = (req, res, next) => {
  try {
    const userInfoHeader = req.headers['x-user-info'];
    if (!userInfoHeader) {
      return res.status(401).json({ error: 'User information is required' });
    }
    
    const userInfo = JSON.parse(userInfoHeader);
    if (!userInfo.userId || !userInfo.role) {
      return res.status(400).json({ error: 'Invalid user information format' });
    }

    // RBAC: Only admin or superadmin can manage doctors
    if (userInfo.role !== 'admin' && userInfo.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied: Administrator access required' });
    }

    req.userInfo = userInfo; // Attach user info for logging or other purposes
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid user information header' });
  }
};

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Doctor Service', version: '1.0.0' });
});

// Get all doctors
app.get('/doctors', isAdmin, async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ createdAt: -1 });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// Get single doctor
app.get('/doctors/:id', isAdmin, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctor' });
  }
});

// Create new doctor
app.post('/doctors', isAdmin, async (req, res) => {
  const { error, value } = doctorValidationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: 'Validation failed', details: error.details.map(d => d.message) });
  }

  try {
    const doctor = new Doctor({
      ...value,
      createdBy: req.userInfo.userId
    });
    await doctor.save();
    res.status(201).json({ success: true, message: 'Doctor created successfully', data: doctor });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A doctor with this email already exists.' });
    }
    res.status(500).json({ error: 'Failed to create doctor' });
  }
});

// Update doctor
app.put('/doctors/:id', isAdmin, async (req, res) => {
  const { error, value } = doctorValidationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: 'Validation failed', details: error.details.map(d => d.message) });
  }

  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true });
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json({ success: true, message: 'Doctor updated successfully', data: doctor });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A doctor with this email already exists.' });
    }
    res.status(500).json({ error: 'Failed to update doctor' });
  }
});

// Delete doctor
app.delete('/doctors/:id', isAdmin, async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json({ success: true, message: 'Doctor deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete doctor' });
  }
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.DOCTOR_SERVICE_PORT || 3003;
app.listen(PORT, () => {
  console.log(` Doctor Service running on port ${PORT}`);
});
