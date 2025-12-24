const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// ============ PUBLIC ENDPOINTS ============

// Check email/phone availability for registration
router.post('/check-email-phone', [
  body('email').isEmail().withMessage('Email tidak valid'),
  body('phone').notEmpty().withMessage('Nomor telepon wajib diisi')
], authController.checkEmailPhone);

// Register
router.post('/register', [
  body('email').isEmail().withMessage('Email tidak valid'),
  body('phone').notEmpty().withMessage('Nomor telepon wajib diisi'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('name').notEmpty().withMessage('Nama wajib diisi')
], authController.register);

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').notEmpty().withMessage('Password wajib diisi')
], authController.login);

// ============ USER ENDPOINTS ============

// Get current user
router.get('/me', verifyToken, authController.getMe);

// Verify token
router.get('/verify', verifyToken, authController.verifyToken);

// ============ ADMIN ENDPOINTS ============

// Get all users (admin only)
router.get('/users', verifyToken, isAdmin, authController.getAllUsers);

// Get unverified users (users yang belum di-verify oleh admin)
router.get('/users/unverified', verifyToken, isAdmin, authController.getUnverifiedUsers);

// Get verified users (users yang sudah di-verify)
router.get('/users/verified', verifyToken, isAdmin, authController.getVerifiedUsers);

// Verify user account (admin only) - IMPORTANT!
// POST /auth/users/verify { userId }
router.post('/users/verify', verifyToken, isAdmin, [
  body('userId').notEmpty().withMessage('userId wajib diisi')
], authController.verifyUser);

// Reject user account (admin only)
// POST /auth/users/reject { userId, reason }
router.post('/users/reject', verifyToken, isAdmin, [
  body('userId').notEmpty().withMessage('userId wajib diisi')
], authController.rejectUser);

// Update user (admin or self)
router.put('/users/:id', verifyToken, authController.updateUser);

// Delete user (admin only)
router.delete('/users/:id', verifyToken, isAdmin, authController.deleteUser);

module.exports = router;

