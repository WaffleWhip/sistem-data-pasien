const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      phone: user.phone,
      role: user.role,
      name: user.name,
      patientId: user.patientId
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Check if email/phone exists in patient data (for auto-bind)
// This will be called from frontend to main-service
exports.checkEmailPhone = async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    if (!email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email dan nomor telepon wajib diisi'
      });
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        status: 'email_exists',
        message: 'Email sudah terdaftar. Silakan login.'
      });
    }

    // Return success - frontend will check with main-service for patient match
    res.json({
      success: true,
      status: 'available',
      message: 'Email tersedia untuk registrasi'
    });
  } catch (error) {
    console.error('CheckEmailPhone error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Register
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors: errors.array()
      });
    }

    const { email, phone, password, name, role, patientId } = req.body;

    // Cek apakah email sudah terdaftar
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }

    // Buat user baru
    const user = await User.create({
      email,
      phone,
      password,
      name,
      role: role || 'user',
      patientId: patientId || null,
      isVerified: patientId ? true : false  // Auto verified if linked to patient
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: patientId ? 'Akun berhasil dibuat dan terhubung dengan data pasien!' : 'Registrasi berhasil.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          role: user.role,
          isVerified: user.isVerified,
          patientId: user.patientId
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    console.log(`Login attempt: ${email}`);

    // Cari user
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    console.log(`User found: ${user.email}, comparing password...`);

    // Verifikasi password
    const isMatch = await user.comparePassword(password);
    console.log(`Password match: ${isMatch}`);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isVerified: user.isVerified,
          patientId: user.patientId
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('GetAllUsers error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, patientId } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // User biasa hanya bisa update dirinya sendiri
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk mengubah user ini'
      });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role && req.user.role === 'admin') user.role = role;
    if (patientId !== undefined) user.patientId = patientId;

    await user.save();

    res.json({
      success: true,
      message: 'User berhasil diupdate',
      data: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        patientId: user.patientId
      }
    });
  } catch (error) {
    console.error('UpdateUser error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'User berhasil dihapus'
    });
  } catch (error) {
    console.error('DeleteUser error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// ============ ADMIN VERIFICATION ENDPOINTS ============

// ADMIN: Verify user account (set isVerified = true)
exports.verifyUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId harus diisi'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'User ini sudah diverifikasi sebelumnya'
      });
    }

    // Verify user
    user.isVerified = true;
    user.verifiedAt = new Date();
    user.verifiedBy = req.user.id;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.name} (${user.email}) berhasil diverifikasi`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        verifiedAt: user.verifiedAt
      }
    });
  } catch (error) {
    console.error('VerifyUser error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// ADMIN: Get unverified users (users yang belum di-verify admin)
exports.getUnverifiedUsers = async (req, res) => {
  try {
    const unverifiedUsers = await User.find({ isVerified: false, role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: unverifiedUsers.length,
      data: unverifiedUsers,
      message: 'Daftar user yang belum diverifikasi oleh admin'
    });
  } catch (error) {
    console.error('GetUnverifiedUsers error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// ADMIN: Get verified users (users yang sudah di-verify + linked)
exports.getVerifiedUsers = async (req, res) => {
  try {
    const verifiedUsers = await User.find({ isVerified: true, role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: verifiedUsers.length,
      data: verifiedUsers,
      message: 'Daftar user yang sudah diverifikasi'
    });
  } catch (error) {
    console.error('GetVerifiedUsers error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// ADMIN: Reject user (set isVerified = false dengan alasan)
exports.rejectUser = async (req, res) => {
  try {
    const { userId, reason } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId harus diisi'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Note: Dalam implementasi real, simpan rejection reason di database
    // Untuk sekarang, hanya set isVerified = false
    user.isVerified = false;
    await user.save();

    res.json({
      success: true,
      message: `Registrasi ${user.name} ditolak. Alasan: ${reason || 'Data tidak sesuai'}`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('RejectUser error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Verify token endpoint
exports.verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        patientId: user.patientId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};
