const Patient = require('../models/Patient.model');

// Create new patient (Admin only)
exports.createPatient = async (req, res) => {
  try {
    // Generate patientId otomatis
    const patientId = 'PAT' + Date.now().toString().slice(-6);
    
    const patientData = {
      ...req.body,
      patientId: patientId,
      userId: req.user.id, // dari auth middleware
      createdBy: req.user.id
    };

    const patient = await Patient.create(patientData);
    
    res.status(201).json({
      success: true,
      message: 'Data pasien berhasil dibuat',
      data: patient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal membuat data pasien',
      error: error.message
    });
  }
};

// Get all patients (Admin: all, User: own only)
exports.getAllPatients = async (req, res) => {
  try {
    let query = {};
    
    // Jika user biasa, hanya bisa lihat data sendiri
    if (req.user.role === 'user') {
      query.userId = req.user.id;
    }
    
    const patients = await Patient.find(query);
    
    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data pasien',
      error: error.message
    });
  }
};

// Get single patient by ID
exports.getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Data pasien tidak ditemukan'
      });
    }
    
    // Authorization check
    if (req.user.role === 'user' && patient.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke data ini'
      });
    }
    
    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data pasien',
      error: error.message
    });
  }
};

// Update patient data
exports.updatePatient = async (req, res) => {
  try {
    let patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Data pasien tidak ditemukan'
      });
    }
    
    // Authorization check
    if (req.user.role === 'user' && patient.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk mengubah data ini'
      });
    }
    
    patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Data pasien berhasil diperbarui',
      data: patient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data pasien',
      error: error.message
    });
  }
};

// Delete patient (Admin only)
exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Data pasien tidak ditemukan'
      });
    }
    
    // Hanya admin yang bisa menghapus
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Hanya admin yang dapat menghapus data pasien'
      });
    }
    
    await Patient.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Data pasien berhasil dihapus'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data pasien',
      error: error.message
    });
  }
};
