const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/authMiddleware');
const c = require('../controllers/searchAlertController');

const router = express.Router();

router.get('/',              requireRole('admin'),                   asyncHandler(c.getAll));    // admin: all alerts
router.get('/user/:user_id', requireRole('admin', 'agent', 'user'), asyncHandler(c.getByUser)); // own alerts
router.post('/',             requireRole('admin', 'agent', 'user'), asyncHandler(c.create));    // create alert
router.put('/:id',           requireRole('admin', 'agent', 'user'), asyncHandler(c.update));    // update alert
router.delete('/:id',        requireRole('admin', 'agent', 'user'), asyncHandler(c.remove));    // delete alert

module.exports = router;
