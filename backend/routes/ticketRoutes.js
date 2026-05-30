const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const c = require('../controllers/ticketController');

const router = express.Router();

// Must come before /:id to avoid collision
router.get('/user/:user_id', asyncHandler(c.getByUser));

router.get('/',     asyncHandler(c.getAll));
router.get('/:id',  asyncHandler(c.getById));
router.post('/',    asyncHandler(c.create));
router.put('/:id',  asyncHandler(c.update));
router.delete('/:id', asyncHandler(c.remove));

module.exports = router;
