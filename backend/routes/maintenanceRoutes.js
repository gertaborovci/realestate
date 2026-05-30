const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole }  = require('../middleware/authMiddleware');
const ctrl = require('../controllers/maintenanceController');

const router = express.Router();

router.get('/',    asyncHandler(ctrl.getAll));
router.get('/:id', asyncHandler(ctrl.getById));
router.post('/',   asyncHandler(ctrl.create));                          // users & agents can submit
router.put('/:id', requireRole('admin'), asyncHandler(ctrl.update));   // admin only
router.delete('/:id', requireRole('admin'), asyncHandler(ctrl.remove)); // admin only

module.exports = router;
