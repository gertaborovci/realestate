const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const c      = require('../controllers/certificationController');
const upload = require('../config/upload');

const router = express.Router();

router.get('/',                asyncHandler(c.getAll));
router.get('/agent/:agent_id', asyncHandler(c.getByAgent));
router.post('/',               upload.single('image'), asyncHandler(c.create));
router.put('/:id',             upload.single('image'), asyncHandler(c.update));
router.delete('/:id',          asyncHandler(c.remove));

module.exports = router;
