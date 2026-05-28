const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const clientController = require('../controllers/clientController');

const router = express.Router();

router.get('/', asyncHandler(clientController.getAll));
router.post('/', asyncHandler(clientController.create));
router.put('/:id', asyncHandler(clientController.update));
router.delete('/:id', asyncHandler(clientController.remove));

module.exports = router;
