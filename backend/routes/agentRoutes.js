const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/authMiddleware');
const agentController = require('../controllers/agentController');

const router = express.Router();

router.get('/',                   asyncHandler(agentController.getAll));
router.get('/by-user/:user_id',   asyncHandler(agentController.getByUserId)); // must be before /:id
router.get('/:id',                asyncHandler(agentController.getById));
router.post('/',   requireRole('admin'), asyncHandler(agentController.create));
router.put('/:id', requireRole('admin'), asyncHandler(agentController.update));
router.delete('/:id', requireRole('admin'), asyncHandler(agentController.remove));

module.exports = router;
