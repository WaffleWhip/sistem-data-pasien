const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*', credentials: true }));
app.use(express.json());

// --- Service URLs ---
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://patient-service:3002';

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/authdb');
    console.log(' Auth Service: MongoDB connected');
  } catch (error) {
    console.error(' MongoDB connection error:', error);
    process.exit(1);
  }
};
connectDB();

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user', 'superadmin'], default: 'user' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

// JWT Helper
const generateToken = (user) => jwt.sign({ userId: user._id, username: user.username, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });

// Validation Middleware
const validateRegister = (req, res, next) => {
  const { username, email, password, phone } = req.body;
  if (!username || !email || !password || !phone) return res.status(400).json({ error: 'Username, email, password, and phone are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email format' });
  next();
};

// ========== ROUTES ==========

app.get('/health', (req, res) => res.json({ status: 'OK' }));

// --- SELF-REGISTRATION LOGIC ---
app.post('/register', validateRegister, async (req, res) => {
  const { username, email, password, phone, name } = req.body;
  let newUser = null;

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    newUser = new User({ username, email, password: hashedPassword, role: 'user' });
    await newUser.save();

    try {
      const patientProfileData = {
        name: name || username,
        phone: phone,
        userId: newUser._id,
        age: 0,
        gender: 'Other',
        address: 'Not specified',
        diagnosis: 'No diagnosis yet',
        status: 'Active',
        createdBy: newUser._id
      };

      const tempUserInfo = JSON.stringify({ userId: newUser._id, role: 'user' });

      await axios.post(`${PATIENT_SERVICE_URL}/patients`, patientProfileData, {
        headers: { 'x-user-info': tempUserInfo }
      });

    } catch (profileError) {
      await User.findByIdAndDelete(newUser._id);
      console.error('Failed to create patient profile:', profileError.response?.data || profileError.message);
      throw new Error('Failed to create corresponding patient profile.');
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user: { id: newUser._id, username: newUser.username, role: newUser.role } }
    });

  } catch (error) {
    console.error('Registration process error:', error.message);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid credentials or deactivated account' });

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user);
    res.json({
      success: true,
      message: 'Login successful',
      data: { user: { id: user._id, username: user.username, email: user.email, role: user.role }, token }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify Token
app.post('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ valid: false, error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) return res.status(401).json({ valid: false, error: 'User not found or deactivated' });

    res.json({ valid: true, userId: decoded.userId, role: decoded.role });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid or expired token' });
  }
});

// Get all users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Error Handling & 404
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});
app.use('*', (req, res) => res.status(404).json({ error: 'Endpoint not found' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Auth Service running on port ${PORT}`));
