const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  fullName: { 
    type: String, 
    required: true 
  },
  dateOfBirth: { 
    type: Date, 
    required: true 
  },
  gender: { 
    type: String, 
    enum: ['Laki-laki', 'Perempuan', 'Lainnya'] 
  },
  address: String,
  phoneNumber: String,
  emergencyContact: String,
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Tidak Tahu']
  },
  allergies: [String],
  medicalHistory: [String],
  userId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  createdBy: {
    type: String,
    required: true
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Patient', patientSchema);
