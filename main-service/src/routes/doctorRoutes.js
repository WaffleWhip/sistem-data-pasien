const express = require('express');
const { body } = require('express-validator');
const doctorController = require('../controllers/doctorController');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get public doctor list (tanpa info sensitif)
router.get('/public', verifyToken, doctorController.getPublicDoctors);

// Get all doctors (semua user bisa lihat)
router.get('/', verifyToken, doctorController.getAllDoctors);

// Search doctors
router.get('/search', verifyToken, doctorController.searchDoctors);

// Get single doctor
router.get('/:id', verifyToken, doctorController.getDoctor);

// Create doctor (admin only)
router.post('/', verifyToken, isAdmin, [
  body('nip').notEmpty().withMessage('NIP wajib diisi'),
  body('name').notEmpty().withMessage('Nama wajib diisi'),
  body('specialization').notEmpty().withMessage('Spesialisasi wajib diisi'),
  body('phone').notEmpty().withMessage('Nomor telepon wajib diisi'),
  body('email').isEmail().withMessage('Email tidak valid')
], doctorController.createDoctor);

// Update doctor (admin only)
router.put('/:id', verifyToken, isAdmin, doctorController.updateDoctor);

// Delete doctor (admin only)
router.delete('/:id', verifyToken, isAdmin, doctorController.deleteDoctor);

module.exports = router;
