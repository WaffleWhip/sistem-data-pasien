const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null
  },
  visitDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  complaint: {
    type: String,
    required: [true, 'Keluhan wajib diisi']
  },
  diagnosis: {
    type: String,
    default: '-'
  },
  treatment: {
    type: String,
    default: '-'
  },
  prescription: {
    type: String,
    default: '-'
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['ongoing', 'completed'],
    default: 'ongoing'
  },
  createdBy: {
    type: String,
    required: true
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

visitSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Visit', visitSchema);
