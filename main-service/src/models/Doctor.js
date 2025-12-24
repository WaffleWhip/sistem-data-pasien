const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  nip: {
    type: String,
    required: [true, 'NIP wajib diisi'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Nama wajib diisi'],
    trim: true
  },
  specialization: {
    type: String,
    required: [true, 'Spesialisasi wajib diisi']
  },
  phone: {
    type: String,
    required: [true, 'Nomor telepon wajib diisi']
  },
  email: {
    type: String,
    required: [true, 'Email wajib diisi'],
    lowercase: true,
    trim: true
  },
  schedule: {
    type: String,
    default: 'Senin - Jumat, 08:00 - 16:00'
  },
  room: {
    type: String,
    default: '-'
  },
  isActive: {
    type: Boolean,
    default: true
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

doctorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Doctor', doctorSchema);
