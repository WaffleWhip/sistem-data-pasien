const mongoose = require('mongoose');

// Schema untuk User (reference ke Auth DB)
// Ini untuk keperluan linking patient ke user
// Actual user data disimpan di auth_db, ini hanya untuk reference
const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  role: String,
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  }
});

module.exports = mongoose.model('User', userSchema);
