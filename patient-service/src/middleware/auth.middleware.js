const axios = require('axios');

const authMiddleware = async (req, res, next) => {
  try {
    // Ambil token dari header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan. Silakan login terlebih dahulu.'
      });
    }
    
    // Verifikasi token ke auth-service
    const authResponse = await axios.get('http://auth-service:3001/api/auth/verify', {
      headers: {
        Authorization: Bearer 
      }
    });
    
    // Simpan data user dari auth-service ke request
    req.user = authResponse.data.data;
    next();
    
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid atau telah kadaluarsa.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan dalam verifikasi token.'
    });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya admin yang diperbolehkan.'
    });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };
