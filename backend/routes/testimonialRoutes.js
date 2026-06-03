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

// Owner or admin can edit/delete
router.put('/:id',
  requireRole('admin', 'agent', 'user'),
  upload.single('photo'),
  asyncHandler(testimonialController.update)
);

router.delete('/:id', requireRole('admin', 'agent', 'user'), asyncHandler(testimonialController.remove));

module.exports = router;
