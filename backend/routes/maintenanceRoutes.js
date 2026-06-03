const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole }  = require('../middleware/authMiddleware');
const ctrl = require('../controllers/maintenanceController');

const router = express.Router();

router.get('/',    requireRole('admin'),                   asyncHandler(ctrl.getAll));   // admin sees all
router.get('/:id', requireRole('admin', 'agent', 'user'), asyncHandler(ctrl.getById));  // own requests
router.post('/',   requireRole('admin', 'agent', 'user'), asyncHandler(ctrl.create));   // any authenticated user
router.put('/:id', requireRole('admin'),                   asyncHandler(ctrl.update));  // admin only
router.delete('/:id', requireRole('admin'),                asyncHandler(ctrl.remove));  // admin only

module.exports = router;
