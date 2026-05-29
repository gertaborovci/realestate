const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const transactionController = require('../controllers/transactionController');

const router = express.Router();

router.get('/',                          asyncHandler(transactionController.getAll));
router.get('/agent/:agent_id',           asyncHandler(transactionController.getByAgent));
router.get('/contract/:contract_id',     asyncHandler(transactionController.getByContract));
router.post('/',                         asyncHandler(transactionController.create));
router.put('/:id/status',               asyncHandler(transactionController.updateStatus));
router.delete('/:id',                   asyncHandler(transactionController.remove));

module.exports = router;
