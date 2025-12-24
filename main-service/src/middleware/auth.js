const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token tidak tersedia.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid atau sudah kadaluarsa.'
    });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya admin yang diizinkan.'
    });
  }
  next();
};

const canAccessPatient = (req, res, next) => {
  // Admin bisa akses semua
  if (req.user.role === 'admin') {
    return next();
  }
  
  // User hanya bisa akses data miliknya (berdasarkan patientId)
  if (req.user.patientId && req.params.id === req.user.patientId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Anda tidak memiliki akses ke data ini.'
  });
};

module.exports = { verifyToken, isAdmin, canAccessPatient };
