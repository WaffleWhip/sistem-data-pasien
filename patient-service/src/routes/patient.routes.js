const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient
} = require('../controllers/patient.controller');

// Apply auth middleware untuk semua routes
router.use(authMiddleware);

// CRUD Routes
router.post('/patients', adminMiddleware, createPatient); // Hanya admin
router.get('/patients', getAllPatients); // Admin: semua, User: milik sendiri
router.get('/patients/:id', getPatientById);
router.put('/patients/:id', updatePatient);
router.delete('/patients/:id', adminMiddleware, deletePatient); // Hanya admin

module.exports = router;
