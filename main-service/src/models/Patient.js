const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nama wajib diisi'],
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    default: null
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Tanggal lahir wajib diisi']
  },
  gender: {
    type: String,
    enum: ['Laki-laki', 'Perempuan'],
    required: [true, 'Jenis kelamin wajib diisi']
  },
  address: {
    type: String,
    required: [true, 'Alamat wajib diisi']
  },
  phone: {
    type: String,
    required: [true, 'Nomor telepon wajib diisi'],
    unique: true,
    trim: true
  },
  bloodType: {
    type: String,
    enum: ['A', 'B', 'AB', 'O', '-'],
    default: '-'
  },
  allergies: {
    type: String,
    default: '-'
  },
  medicalHistory: {
    type: String,
    default: '-'
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null
  },
  userId: {
    type: String,
    default: null
  },
  // Bind request dari admin ketika input patient dengan email/phone yang cocok dengan user
  bindRequest: {
    type: {
      userId: String,
      userName: String,
      userEmail: String,
      requestedAt: Date,
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
    },
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

patientSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Patient', patientSchema);
