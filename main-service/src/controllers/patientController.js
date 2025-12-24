const Patient = require('../models/Patient');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');
const { createNotification } = require('./notificationController');

// Check if email/phone matches existing patient for auto-bind during registration
exports.checkPatientMatch = async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    if (!email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email dan nomor telepon wajib diisi'
      });
    }

    // Find patient by phone OR email match
    const patientByPhone = await Patient.findOne({ phone: phone.trim() });
    const patientByEmail = await Patient.findOne({ email: email.toLowerCase().trim() });
    
    // Check if any match and not yet linked
    let matchedPatient = null;
    let matchType = null;
    
    if (patientByPhone && !patientByPhone.userId) {
      matchedPatient = patientByPhone;
      matchType = patientByEmail && patientByEmail._id.equals(patientByPhone._id) ? 'both' : 'phone';
    } else if (patientByEmail && !patientByEmail.userId) {
      matchedPatient = patientByEmail;
      matchType = 'email';
    }
    
    if (matchedPatient) {
      return res.json({
        success: true,
        status: 'match_found',
        matchType: matchType,
        message: `Data pasien ditemukan berdasarkan ${matchType === 'both' ? 'email dan nomor HP' : matchType === 'phone' ? 'nomor HP' : 'email'}`,
        data: {
          patientId: matchedPatient._id,
          name: matchedPatient.name,
          phone: matchedPatient.phone,
          email: matchedPatient.email,
          gender: matchedPatient.gender,
          dateOfBirth: matchedPatient.dateOfBirth
        }
      });
    }
    
    // Check if already linked
    if ((patientByPhone && patientByPhone.userId) || (patientByEmail && patientByEmail.userId)) {
      return res.json({
        success: true,
        status: 'already_linked',
        message: 'Data pasien dengan email/HP ini sudah terhubung ke akun lain'
      });
    }
    
    // No match found
    res.json({
      success: true,
      status: 'no_match',
      message: 'Tidak ada data pasien yang cocok. Lanjutkan registrasi sebagai user baru.'
    });
  } catch (error) {
    console.error('CheckPatientMatch error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Check if user exists with matching email/phone (for admin when adding patient)
exports.checkUserMatch = async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    if (!email && !phone) {
      return res.json({
        success: true,
        userFound: false
      });
    }

    // Find user by email OR phone
    let user = null;
    if (email) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    }
    if (!user && phone) {
      user = await User.findOne({ phone: phone.trim() });
    }
    
    if (user && !user.patientId) {
      return res.json({
        success: true,
        userFound: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone
        }
      });
    }
    
    res.json({
      success: true,
      userFound: false
    });
  } catch (error) {
    console.error('CheckUserMatch error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Auto-bind user to patient after registration
exports.autoBind = async (req, res) => {
  try {
    const { patientId, userId, userName, userEmail } = req.body;
    
    if (!patientId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'patientId dan userId wajib diisi'
      });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Pasien tidak ditemukan'
      });
    }

    if (patient.userId) {
      return res.status(400).json({
        success: false,
        message: 'Pasien sudah terhubung ke akun lain'
      });
    }

    // Link patient to user
    patient.userId = userId;
    patient.email = userEmail || patient.email;
    await patient.save();

    res.json({
      success: true,
      message: 'Akun berhasil dihubungkan dengan data pasien',
      data: {
        patientId: patient._id,
        patientName: patient.name,
        userId: userId
      }
    });
  } catch (error) {
    console.error('AutoBind error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Get bind requests for current user
exports.getMyBindRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const patients = await Patient.find({
      'bindRequest.userId': userId,
      'bindRequest.status': 'pending'
    }).populate('doctor', 'name specialization');

    res.json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    console.error('GetMyBindRequests error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// User approves bind request
exports.approveBindRequest = async (req, res) => {
  try {
    const { patientId } = req.body;
    const userId = req.user.id;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Pasien tidak ditemukan'
      });
    }

    // Allow linking if notification was sent (check by patientId in notification data)
    const linkNotification = await Notification.findOne({
      userId: userId,
      type: 'link_request',
      'data.patientId': patientId
    });

    if (!linkNotification && (!patient.bindRequest || patient.bindRequest.userId !== userId)) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada permintaan bind untuk akun Anda'
      });
    }

    // Approve and link
    patient.userId = userId;
    if (patient.bindRequest) {
      patient.bindRequest.status = 'approved';
    }
    await patient.save();

    // Mark notification as read
    if (linkNotification) {
      linkNotification.isRead = true;
      await linkNotification.save();
    }

    // Send success notification
    await createNotification(
      userId,
      'account_linked',
      'Akun Berhasil Dihubungkan',
      `Data pasien atas nama "${patient.name}" berhasil dihubungkan ke akun Anda. Anda sekarang dapat melihat riwayat kunjungan.`,
      { patientId: patient._id.toString() },
      '/profile'
    );

    res.json({
      success: true,
      message: 'Data pasien berhasil dihubungkan ke akun Anda',
      data: {
        patientId: patient._id,
        patientName: patient.name
      }
    });
  } catch (error) {
    console.error('ApproveBindRequest error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// User rejects bind request
exports.rejectBindRequest = async (req, res) => {
  try {
    const { patientId } = req.body;
    const userId = req.user.id;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Pasien tidak ditemukan'
      });
    }

    if (!patient.bindRequest || patient.bindRequest.userId !== userId) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada permintaan bind untuk akun Anda'
      });
    }

    // Reject
    patient.bindRequest.status = 'rejected';
    await patient.save();

    res.json({
      success: true,
      message: 'Permintaan bind ditolak'
    });
  } catch (error) {
    console.error('RejectBindRequest error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Get patient data for current logged-in user
exports.getMyPatientData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find patient linked to this user
    const patient = await Patient.findOne({ userId: userId }).populate('doctor', 'name specialization');
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Data pasien belum terhubung ke akun Anda'
      });
    }

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('GetMyPatientData error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Get all patients
exports.getAllPatients = async (req, res) => {
  try {
    let query = {};
    
    // Jika user biasa, hanya tampilkan data miliknya
    if (req.user.role !== 'admin') {
      if (req.user.patientId) {
        query._id = req.user.patientId;
      } else {
        return res.json({
          success: true,
          count: 0,
          data: [],
          message: 'Data pasien Anda belum terdaftar di sistem. Hubungi admin untuk registrasi.'
        });
      }
    }

    const patients = await Patient.find(query).populate('doctor', 'name specialization');
    
    // For admin, check if there are pending link requests (notifications sent)
    if (req.user.role === 'admin') {
      const patientsWithStatus = await Promise.all(patients.map(async (patient) => {
        const p = patient.toObject();
        
        if (p.userId) {
          p.linkStatus = 'linked';
        } else {
          // Check if there's a pending notification for this patient
          const pendingNotif = await Notification.findOne({
            'data.patientId': patient._id.toString(),
            type: 'link_request',
            isRead: false
          });
          
          if (pendingNotif) {
            p.linkStatus = 'pending';
          } else {
            p.linkStatus = 'not_linked';
          }
        }
        
        return p;
      }));
      
      return res.json({
        success: true,
        count: patientsWithStatus.length,
        data: patientsWithStatus
      });
    }
    
    res.json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    console.error('GetAllPatients error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Get single patient
exports.getPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('doctor', 'name specialization phone email');
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Pasien tidak ditemukan'
      });
    }

    // Cek akses user biasa
    if (req.user.role !== 'admin' && patient._id.toString() !== req.user.patientId) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke data ini'
      });
    }

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('GetPatient error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Create patient (admin only)
exports.createPatient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors: errors.array()
      });
    }

    const { name, email, dateOfBirth, gender, address, phone, bloodType, allergies, medicalHistory, doctor } = req.body;

    // Cek phone sudah ada
    const existingPatient = await Patient.findOne({ phone: phone.trim() });
    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: 'Nomor telepon sudah terdaftar'
      });
    }

    // Check if there's a user with matching email or phone for auto-bind request
    let matchedUser = null;
    
    if (email || phone) {
      // Find user with matching email OR phone
      const userByEmail = email ? await User.findOne({ email: email.toLowerCase().trim() }) : null;
      const userByPhone = await User.findOne({ phone: phone.trim() });
      
      matchedUser = userByEmail || userByPhone;
    }

    const patient = await Patient.create({
      name,
      email: email ? email.toLowerCase().trim() : null,
      dateOfBirth,
      gender,
      address,
      phone: phone.trim(),
      bloodType,
      allergies,
      medicalHistory,
      doctor,
      userId: null,
      bindRequest: null
    });

    let message = 'Pasien berhasil ditambahkan';
    let notificationSent = false;
    
    // If matched user found (and not already linked to another patient), send notification
    if (matchedUser && !matchedUser.patientId) {
      await createNotification(
        matchedUser._id.toString(),
        'link_request',
        'Permintaan Hubungkan Data Pasien',
        `Admin telah membuat data pasien atas nama "${name}" yang cocok dengan akun Anda. Klik untuk menghubungkan.`,
        { 
          patientId: patient._id.toString(),
          patientName: name,
          patientPhone: phone,
          patientEmail: email
        },
        '/profile'
      );
      
      message = `Pasien berhasil ditambahkan. Notifikasi telah dikirim ke user ${matchedUser.name} (${matchedUser.email}).`;
      notificationSent = true;
    }

    res.status(201).json({
      success: true,
      message: message,
      data: patient,
      notificationSent
    });
  } catch (error) {
    console.error('CreatePatient error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Create patient from user registration (minimal data)
exports.createPatientFromUser = async (req, res) => {
  try {
    const { name, email, phone, userId } = req.body;

    // Check if patient with this email/phone already exists
    const existingByPhone = phone ? await Patient.findOne({ phone: phone.trim() }) : null;
    const existingByEmail = email ? await Patient.findOne({ email: email.toLowerCase().trim() }) : null;
    
    if (existingByPhone || existingByEmail) {
      return res.status(400).json({
        success: false,
        message: 'Data pasien dengan email atau nomor telepon ini sudah ada'
      });
    }

    const patient = await Patient.create({
      name,
      email: email ? email.toLowerCase().trim() : null,
      phone: phone ? phone.trim() : null,
      userId: userId,
      gender: 'Laki-laki', // Default
      dateOfBirth: new Date('2000-01-01'), // Default
      address: '-',
      bloodType: '-'
    });

    res.status(201).json({
      success: true,
      message: 'Data pasien berhasil dibuat',
      data: patient
    });
  } catch (error) {
    console.error('CreatePatientFromUser error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Update patient
exports.updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Pasien tidak ditemukan'
      });
    }

    // User biasa hanya bisa update data sendiri dan field tertentu
    if (req.user.role !== 'admin') {
      if (patient._id.toString() !== req.user.patientId) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki akses untuk mengubah data ini'
        });
      }
      
      // User hanya bisa update field tertentu
      const allowedFields = ['phone', 'address', 'allergies'];
      const updateData = {};
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });
      
      const updatedPatient = await Patient.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate('doctor', 'name specialization');

      return res.json({
        success: true,
        message: 'Data pasien berhasil diupdate',
        data: updatedPatient
      });
    }

    // Admin bisa update semua field
    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('doctor', 'name specialization');

    res.json({
      success: true,
      message: 'Data pasien berhasil diupdate',
      data: updatedPatient
    });
  } catch (error) {
    console.error('UpdatePatient error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Delete patient (admin only)
exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Pasien tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Pasien berhasil dihapus'
    });
  } catch (error) {
    console.error('DeletePatient error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Search patients
exports.searchPatients = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Query pencarian diperlukan'
      });
    }

    let query = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ]
    };

    // User biasa hanya bisa cari data miliknya
    if (req.user.role !== 'admin') {
      query._id = req.user.patientId;
    }

    const patients = await Patient.find(query).populate('doctor', 'name specialization');

    res.json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    console.error('SearchPatients error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// ADMIN: Link user to patient (very important!)
exports.linkUserToPatient = async (req, res) => {
  try {
    const { userId, patientId } = req.body;

    // Validasi
    if (!userId || !patientId) {
      return res.status(400).json({
        success: false,
        message: 'userId dan patientId harus diisi'
      });
    }

    // Cek patient ada
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Pasien tidak ditemukan'
      });
    }

    // Cek patient belum di-link ke user lain
    const existingPatient = await Patient.findOne({ userId: { $ne: null }, _id: { $ne: patientId } });
    if (existingPatient && existingPatient.userId !== userId) {
      // If other patient linked to same user, unlink it
      await Patient.updateMany({ userId: userId }, { userId: null });
    }

    // Link patient ke user
    patient.userId = userId;
    await patient.save();

    res.json({
      success: true,
      message: `Pasien ${patient.name} berhasil dihubungkan ke user account`,
      data: {
        patient: {
          id: patient._id,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          userId: patient.userId
        }
      }
    });
  } catch (error) {
    console.error('LinkUserToPatient error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// ADMIN: Unlink user from patient
exports.unlinkUserFromPatient = async (req, res) => {
  try {
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'patientId harus diisi'
      });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Pasien tidak ditemukan'
      });
    }

    if (!patient.userId) {
      return res.status(400).json({
        success: false,
        message: 'Pasien ini tidak terhubung ke user akun apapun'
      });
    }

    // Unlink
    const linkedUserId = patient.userId;
    patient.userId = null;
    await patient.save();

    res.json({
      success: true,
      message: `Pasien ${patient.name} berhasil dilepaskan dari user account`,
      data: {
        patientId: patient._id,
        patientName: patient.name,
        previousUserId: linkedUserId
      }
    });
  } catch (error) {
    console.error('UnlinkUserFromPatient error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// ADMIN: Get unlinked patients (pasien yang belum di-link ke user)
exports.getUnlinkedPatients = async (req, res) => {
  try {
    const unlinkedPatients = await Patient.find({ userId: null }).populate('doctor', 'name specialization');

    res.json({
      success: true,
      count: unlinkedPatients.length,
      data: unlinkedPatients,
      message: 'Daftar pasien yang belum di-link ke user account'
    });
  } catch (error) {
    console.error('GetUnlinkedPatients error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};
