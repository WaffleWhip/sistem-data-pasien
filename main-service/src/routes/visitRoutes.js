const express = require('express');
const { body } = require('express-validator');
const visitController = require('../controllers/visitController');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get my visits (for logged in user)
router.get('/my-visits', visitController.getMyVisits);

// Get visits by patient (admin only)
router.get('/patient/:patientId', isAdmin, visitController.getVisitsByPatient);

// Get all visits (admin only)
router.get('/', isAdmin, visitController.getAllVisits);

// Create visit (admin only)
router.post('/', isAdmin, [
  body('patientId').notEmpty().withMessage('patientId wajib diisi'),
  body('complaint').notEmpty().withMessage('Keluhan wajib diisi')
], visitController.createVisit);

// Update visit (admin only)
router.put('/:id', isAdmin, visitController.updateVisit);

// Delete visit (admin only)
router.delete('/:id', isAdmin, visitController.deleteVisit);

module.exports = router;
