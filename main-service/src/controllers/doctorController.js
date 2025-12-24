const Doctor = require('../models/Doctor');
const { validationResult } = require('express-validator');

// Get public doctors (without sensitive info like email/phone)
exports.getPublicDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ isActive: true })
      .select('name specialization schedule room');
    
    res.json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    console.error('GetPublicDoctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Get all doctors
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ isActive: true });
    
    res.json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    console.error('GetAllDoctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Get single doctor
exports.getDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Dokter tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('GetDoctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Create doctor (admin only)
exports.createDoctor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors: errors.array()
      });
    }

    const { nip, name, specialization, phone, email, schedule, room } = req.body;

    // Cek NIP sudah ada
    const existingDoctor = await Doctor.findOne({ nip });
    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: 'NIP sudah terdaftar'
      });
    }

    const doctor = await Doctor.create({
      nip,
      name,
      specialization,
      phone,
      email,
      schedule,
      room
    });

    res.status(201).json({
      success: true,
      message: 'Dokter berhasil ditambahkan',
      data: doctor
    });
  } catch (error) {
    console.error('CreateDoctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Update doctor (admin only)
exports.updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Dokter tidak ditemukan'
      });
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Data dokter berhasil diupdate',
      data: updatedDoctor
    });
  } catch (error) {
    console.error('UpdateDoctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Delete doctor (admin only)
exports.deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Dokter tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Dokter berhasil dihapus'
    });
  } catch (error) {
    console.error('DeleteDoctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Search doctors
exports.searchDoctors = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Query pencarian diperlukan'
      });
    }

    const doctors = await Doctor.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { specialization: { $regex: q, $options: 'i' } },
        { nip: { $regex: q, $options: 'i' } }
      ]
    });

    res.json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    console.error('SearchDoctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};
