require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');
const cors = require('cors');
const helmet = require('helmet');
const app = express();

// --- Helper Function to Standardize Phone Numbers ---
const standardizePhone = (phone) => {
  if (typeof phone !== 'string') return phone;
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('62')) return `0${cleaned.substring(2)}`;
  if (cleaned.startsWith('0')) return cleaned;
  return `0${cleaned}`;
};

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27018/patientdb');
    console.log(' Patient Service: MongoDB connected');
  } catch (error) {
    console.error(' MongoDB connection error:', error);
    process.exit(1);
  }
};
connectDB();

// Joi validation schemas
const patientValidationSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  age: Joi.number().integer().min(0).max(150).required(),
  gender: Joi.string().valid('Male', 'Female', 'Other').required(),
  address: Joi.string().min(5).max(500).required(),
  phone: Joi.string().required(),
  diagnosis: Joi.string().min(3).max(500).required(),
  doctorNotes: Joi.string().max(1000).allow('').optional(),
  assignedDoctorId: Joi.string().allow('', null).optional(),
  assignedDoctorName: Joi.string().allow('', null).optional(),
  status: Joi.string().valid('Active', 'Inactive', 'Recovered', 'Deceased').default('Active'),
  userId: Joi.string().allow('', null).optional(),
  createdBy: Joi.string().allow('', null).optional()
});

// Patient Schema
const patientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 0 },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
  address: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true, unique: true },
  diagnosis: { type: String, required: true, trim: true },
  doctorNotes: { type: String, trim: true, default: '' },
  assignedDoctorId: { type: String, default: null },
  assignedDoctorName: { type: String, default: null },
  status: { type: String, enum: ['Active', 'Inactive', 'Recovered', 'Deceased'], default: 'Active' },
  createdBy: { type: String },
  userId: { type: String, default: null, unique: true, sparse: true },
  medicalHistory: [{
    diagnosis: String,
    doctorNotes: String,
    status: String,
    updatedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });
const Patient = mongoose.model('Patient', patientSchema);

// Middleware
const extractUserInfo = (req, res, next) => {
  try {
    const userInfo = req.headers['x-user-info'];
    if (!userInfo) return res.status(401).json({ error: 'User information required' });
    req.userInfo = JSON.parse(userInfo);
    if (!req.userInfo.userId || !req.userInfo.role) return res.status(400).json({ error: 'Invalid user information' });
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid user information' });
  }
};

// Health Check
app.get('/health', (req, res) => res.json({ status: 'OK' }));

// Create new patient
app.post('/patients', extractUserInfo, async (req, res) => {
  try {
    const { role, userId } = req.userInfo;
    const isUserCreatingOwnProfile = role === 'user' && req.body.userId === userId;
    const isAdminCreating = role === 'admin' || role === 'superadmin';

    if (!isUserCreatingOwnProfile && !isAdminCreating) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (isUserCreatingOwnProfile) {
      const existingProfile = await Patient.findOne({ userId: userId });
      if (existingProfile) {
        return res.status(409).json({ error: 'You already have a patient profile.' });
      }
    }

    if (req.body.phone) {
      req.body.phone = standardizePhone(req.body.phone);
    }

    // 1. Run Validation FIRST
    const { error, value } = patientValidationSchema.validate(req.body);
    if (error) return res.status(400).json({ error: 'Validation failed', details: error.details.map(d => d.message) });

    // 2. Check for existing patient with the same phone number (Auto-Binding)
    if (value.phone) {
      const existingPatientByPhone = await Patient.findOne({ phone: value.phone });
      if (existingPatientByPhone) {
        // If the patient exists but is already linked to a user, reject it
        if (existingPatientByPhone.userId) {
           return res.status(409).json({ error: 'A patient with this phone number is already registered to a user account.' });
        }
        
        // If the patient exists and is NOT linked (created by Admin), BIND IT
        existingPatientByPhone.userId = userId;
        // We do NOT overwrite name/address/diagnosis because the Admin's clinical data is likely more accurate/important
        await existingPatientByPhone.save();
        
        console.log(`[Patient Service] Auto-bound User ${userId} to Patient ${existingPatientByPhone._id}`);
        return res.status(200).json({ success: true, message: 'Patient profile linked successfully', data: existingPatientByPhone });
      }
    }
    
    // 3. Create New Patient if no existing one was found
    value.createdBy = userId;

    const patient = new Patient(value);
    await patient.save();
    
    res.status(201).json({ success: true, message: 'Patient created successfully', data: patient });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'A patient with this user ID already exists.' });
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// Get all patients
app.get('/patients', extractUserInfo, async (req, res) => {
  try {
    const filter = {};
    if (req.userInfo.role === 'user') filter.userId = req.userInfo.userId;
    const patients = await Patient.find(filter).sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get single patient
app.get('/patients/:id', extractUserInfo, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid patient ID format' });
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (req.userInfo.role === 'user' && patient.userId?.toString() !== req.userInfo.userId) return res.status(403).json({ error: 'Access denied' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// Update patient
app.put('/patients/:id', extractUserInfo, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid patient ID format' });
    
    const existingPatient = await Patient.findById(req.params.id);
    if (!existingPatient) return res.status(404).json({ error: 'Patient not found' });

    if (req.userInfo.role === 'user' && existingPatient.userId?.toString() !== req.userInfo.userId) return res.status(403).json({ error: 'Access denied' });
    
    if (req.body.phone) {
      req.body.phone = standardizePhone(req.body.phone);
    }

    const { error, value } = patientValidationSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ error: 'Validation failed', details: error.details.map(d => d.message) });
    
    // Check if diagnosis or status has changed to add to history
    if (value.diagnosis !== existingPatient.diagnosis || value.status !== existingPatient.status) {
      existingPatient.medicalHistory.push({
        diagnosis: existingPatient.diagnosis,
        doctorNotes: existingPatient.doctorNotes,
        status: existingPatient.status,
        updatedAt: new Date()
      });
    }

    Object.assign(existingPatient, value);
    await existingPatient.save();
    
    res.json({ success: true, message: 'Patient updated successfully', data: existingPatient });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'A patient with this phone number already exists.' });
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// Delete patient
app.delete('/patients/:id', extractUserInfo, async (req, res) => {
  try {
    if (req.userInfo.role !== 'admin' && req.userInfo.role !== 'superadmin') return res.status(403).json({ error: 'Access denied' });
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid patient ID format' });
    
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    
    res.json({ success: true, message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

// Error Handling & 404
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});
app.use('*', (req, res) => res.status(404).json({ error: 'Endpoint not found' }));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Patient Service running on port ${PORT}`));
