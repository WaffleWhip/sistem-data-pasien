const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email wajib diisi'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    default: null,
    trim: true,
    validate: {
      validator: function() {
        // Phone wajib untuk user, optional untuk admin
        if (this.role === 'admin') return true;
        return !!this.phone;
      },
      message: 'Nomor telepon wajib diisi untuk user'
    }
  },
  password: {
    type: String,
    required: [true, 'Password wajib diisi'],
    minlength: 6
  },
  name: {
    type: String,
    required: [true, 'Nama wajib diisi'],
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false,
    description: 'Apakah user sudah diverifikasi oleh admin'
  },
  patientId: {
    type: String,
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  verifiedBy: {
    type: String,
    default: null,
    description: 'Admin user ID yang verify akun ini'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password sebelum save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method untuk compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
