const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const agentController = require('../controllers/agentController');

const router = express.Router();

router.get('/', asyncHandler(agentController.getAll));
router.get('/:id', asyncHandler(agentController.getById));
router.post('/', asyncHandler(agentController.create));
router.put('/:id', asyncHandler(agentController.update));
router.delete('/:id', asyncHandler(agentController.remove));

module.exports = router;
