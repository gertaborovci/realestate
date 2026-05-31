const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const c = require('../controllers/officeController');

const router = express.Router();

// Admin: all offices (active + inactive) — must come before GET /
router.get('/all', asyncHandler(c.getAllAdmin));

// Public: active only
router.get('/',     asyncHandler(c.getAll));
router.get('/:id',  asyncHandler(c.getById));
router.post('/',    asyncHandler(c.create));
router.put('/:id',  asyncHandler(c.update));
router.delete('/:id', asyncHandler(c.remove));

module.exports = router;
