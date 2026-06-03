const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/authMiddleware');
const testimonialController = require('../controllers/testimonialController');
const upload = require('../config/upload');

const router = express.Router();

// Public: anyone can read testimonials
router.get('/', asyncHandler(testimonialController.getAll));

// Authenticated users can submit their own testimonial
router.post('/',
  requireRole('admin', 'agent', 'user'),
  upload.single('photo'),
  asyncHandler(testimonialController.create)
);

// Admin can edit any; users only see the update route but the controller
// should enforce ownership — admin role required here for simplicity
router.put('/:id',
  requireRole('admin'),
  upload.single('photo'),
  asyncHandler(testimonialController.update)
);

// Admin deletes
router.delete('/:id', requireRole('admin'), asyncHandler(testimonialController.remove));

module.exports = router;
