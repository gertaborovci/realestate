const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/authMiddleware');
const c = require('../controllers/propertyReviewController');

const router = express.Router();

router.get('/property/:property_id', asyncHandler(c.getByProperty));                                         // public
router.get('/user/:user_id',         requireRole('admin', 'agent', 'user'), asyncHandler(c.getByUser));
router.get('/',                      requireRole('admin'),                   asyncHandler(c.getAll));
router.post('/',                     requireRole('admin', 'agent', 'user'),  asyncHandler(c.create));
router.put('/:id',                   requireRole('admin', 'agent', 'user'),  asyncHandler(c.update));
router.delete('/:id',                requireRole('admin'),                   asyncHandler(c.remove));

module.exports = router;
