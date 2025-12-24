const express = require('express');
const { body } = require('express-validator');
const patientController = require('../controllers/patientController');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// ============ PUBLIC ENDPOINTS (before verifyToken) ============

// Check if email/phone matches existing patient for auto-bind during registration
router.post('/check-match', [
  body('email').isEmail().withMessage('Email tidak valid'),
  body('phone').notEmpty().withMessage('Nomor telepon wajib diisi')
], patientController.checkPatientMatch);

// Auto-bind user to patient after registration (public - called right after register)
router.post('/auto-bind', [
  body('patientId').notEmpty().withMessage('patientId wajib diisi'),
  body('userId').notEmpty().withMessage('userId wajib diisi')
], patientController.autoBind);

// Create patient from user registration (minimal data)
router.post('/create-from-user', verifyToken, [
  body('name').notEmpty().withMessage('Nama wajib diisi'),
  body('userId').notEmpty().withMessage('userId wajib diisi')
], patientController.createPatientFromUser);

// ============ ADMIN ENDPOINTS ============

// Check if user exists with matching email/phone (admin only - when adding patient)
router.post('/check-user-match', verifyToken, isAdmin, patientController.checkUserMatch);

// Get unlinked patients (admin only) - pasien yang belum di-link ke user
router.get('/admin/unlinked-patients', verifyToken, isAdmin, patientController.getUnlinkedPatients);

// Link patient to user account (admin only)
router.post('/admin/link', verifyToken, isAdmin, [
  body('userId').notEmpty().withMessage('userId wajib diisi'),
  body('patientId').notEmpty().withMessage('patientId wajib diisi')
], patientController.linkUserToPatient);

// Unlink patient from user account (admin only)
router.post('/admin/unlink', verifyToken, isAdmin, [
  body('patientId').notEmpty().withMessage('patientId wajib diisi')
], patientController.unlinkUserFromPatient);

// ============ BIND REQUEST ENDPOINTS ============

// Get my bind requests (user)
router.get('/my-bind-requests', verifyToken, patientController.getMyBindRequests);

// Approve bind request (user)
router.post('/bind-request/approve', verifyToken, [
  body('patientId').notEmpty().withMessage('patientId wajib diisi')
], patientController.approveBindRequest);

// Reject bind request (user)
router.post('/bind-request/reject', verifyToken, [
  body('patientId').notEmpty().withMessage('patientId wajib diisi')
], patientController.rejectBindRequest);

// ============ USER ENDPOINTS ============

// Get my patient data (for logged in user)
router.get('/my-data', verifyToken, patientController.getMyPatientData);

// Search patients (before :id route)
router.get('/search', verifyToken, patientController.searchPatients);

// Get all patients (for this user, or all for admin)
router.get('/', verifyToken, patientController.getAllPatients);

// Get single patient
router.get('/:id', verifyToken, patientController.getPatient);

// Create patient (admin only)
router.post('/', verifyToken, isAdmin, [
  body('name').notEmpty().withMessage('Nama wajib diisi'),
  body('dateOfBirth').notEmpty().withMessage('Tanggal lahir wajib diisi'),
  body('gender').isIn(['Laki-laki', 'Perempuan']).withMessage('Jenis kelamin tidak valid'),
  body('address').notEmpty().withMessage('Alamat wajib diisi'),
  body('phone').notEmpty().withMessage('Nomor telepon wajib diisi')
], patientController.createPatient);

// Update patient
router.put('/:id', verifyToken, patientController.updatePatient);

// Delete patient (admin only)
router.delete('/:id', verifyToken, isAdmin, patientController.deletePatient);

module.exports = router;

