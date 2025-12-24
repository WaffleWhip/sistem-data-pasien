const Visit = require('../models/Visit');
const Patient = require('../models/Patient');
const { validationResult } = require('express-validator');
const { createNotification } = require('./notificationController');

// Get all visits
exports.getAllVisits = async (req, res) => {
  try {
    const visits = await Visit.find()
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .sort({ visitDate: -1 });
    
    res.json({
      success: true,
      count: visits.length,
      data: visits
    });
  } catch (error) {
    console.error('GetAllVisits error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Get visits by patient
exports.getVisitsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const visits = await Visit.find({ patient: patientId })
      .populate('doctor', 'name specialization')
      .sort({ visitDate: -1 });
    
    res.json({
      success: true,
      count: visits.length,
      data: visits
    });
  } catch (error) {
    console.error('GetVisitsByPatient error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Get my visits (for logged in user with patientId)
exports.getMyVisits = async (req, res) => {
  try {
    // Find patient linked to this user
    const patient = await Patient.findOne({ userId: req.user.id });
    
    if (!patient) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        message: 'Akun belum terhubung dengan data pasien'
      });
    }
    
    const visits = await Visit.find({ patient: patient._id })
      .populate('doctor', 'name specialization')
      .sort({ visitDate: -1 });
    
    res.json({
      success: true,
      count: visits.length,
      data: visits
    });
  } catch (error) {
    console.error('GetMyVisits error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Create visit (admin only)
exports.createVisit = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors: errors.array()
      });
    }
    
    const { patientId, doctorId, visitDate, complaint, diagnosis, treatment, prescription, notes, status } = req.body;
    
    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Pasien tidak ditemukan'
      });
    }
    
    // Check if patient data is complete
    const missingFields = [];
    if (!patient.dateOfBirth) missingFields.push('Tanggal Lahir');
    if (!patient.gender) missingFields.push('Jenis Kelamin');
    if (!patient.address || patient.address === '-') missingFields.push('Alamat');
    if (!patient.bloodType || patient.bloodType === '-') missingFields.push('Golongan Darah');
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Data pasien belum lengkap. Harap lengkapi data pasien sebelum membuat rujukan.',
        missingFields: missingFields,
        patientId: patientId
      });
    }
    
    const visit = new Visit({
      patient: patientId,
      doctor: doctorId || null,
      visitDate: visitDate || new Date(),
      complaint,
      diagnosis: diagnosis || '-',
      treatment: treatment || '-',
      prescription: prescription || '-',
      notes: notes || '',
      status: status || 'ongoing',
      createdBy: req.user.id
    });
    
    await visit.save();
    
    // If patient has userId, send notification
    if (patient.userId) {
      await createNotification(
        patient.userId,
        'visit_created',
        'Rujukan Baru Dibuat',
        `Rujukan baru telah dibuat untuk Anda pada ${new Date(visit.visitDate).toLocaleDateString('id-ID')}. Keluhan: ${complaint}`,
        { visitId: visit._id },
        '/profile'
      );
    }
    
    res.status(201).json({
      success: true,
      message: 'Kunjungan berhasil dicatat',
      data: visit
    });
  } catch (error) {
    console.error('CreateVisit error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Update visit (admin only)
exports.updateVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorId, visitDate, complaint, diagnosis, treatment, prescription, notes, status } = req.body;
    
    const visit = await Visit.findById(id);
    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Kunjungan tidak ditemukan'
      });
    }
    
    if (doctorId !== undefined) visit.doctor = doctorId;
    if (visitDate) visit.visitDate = visitDate;
    if (complaint) visit.complaint = complaint;
    if (diagnosis) visit.diagnosis = diagnosis;
    if (treatment) visit.treatment = treatment;
    if (prescription) visit.prescription = prescription;
    if (notes !== undefined) visit.notes = notes;
    
    const oldStatus = visit.status;
    if (status) visit.status = status;
    
    await visit.save();
    
    // Notify user about status changes
    const patient = await Patient.findById(visit.patient);
    if (patient && patient.userId && status && status !== oldStatus) {
      if (status === 'completed') {
        await createNotification(
          patient.userId,
          'visit_completed',
          'Kunjungan Selesai',
          `Kunjungan Anda pada ${new Date(visit.visitDate).toLocaleDateString('id-ID')} telah selesai. Terima kasih telah menggunakan layanan kami.`,
          { visitId: visit._id },
          '/profile'
        );
      } else if (status === 'ongoing') {
        await createNotification(
          patient.userId,
          'visit_updated',
          'Status Kunjungan Diperbarui',
          `Status kunjungan Anda pada ${new Date(visit.visitDate).toLocaleDateString('id-ID')} sedang dalam proses.`,
          { visitId: visit._id },
          '/profile'
        );
      }
    }
    
    res.json({
      success: true,
      message: 'Kunjungan berhasil diupdate',
      data: visit
    });
  } catch (error) {
    console.error('UpdateVisit error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Delete visit (admin only)
exports.deleteVisit = async (req, res) => {
  try {
    const { id } = req.params;
    
    const visit = await Visit.findByIdAndDelete(id);
    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Kunjungan tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      message: 'Kunjungan berhasil dihapus'
    });
  } catch (error) {
    console.error('DeleteVisit error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

module.exports = exports;
