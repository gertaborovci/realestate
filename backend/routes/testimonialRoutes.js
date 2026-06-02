const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const testimonialController = require('../controllers/testimonialController');
const upload = require('../config/upload');

const router = express.Router();

router.get('/',       asyncHandler(testimonialController.getAll));
router.post('/',      upload.single('photo'), asyncHandler(testimonialController.create));
router.put('/:id',    upload.single('photo'), asyncHandler(testimonialController.update));
router.delete('/:id', asyncHandler(testimonialController.remove));

module.exports = router;
