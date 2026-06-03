const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/authMiddleware');
const favoriteController = require('../controllers/favoriteController');

const router = express.Router();

router.get('/:user_id',    requireRole('admin', 'agent', 'user'), asyncHandler(favoriteController.getByUser));
router.post('/',           requireRole('admin', 'agent', 'user'), asyncHandler(favoriteController.create));
router.delete('/item/:id', requireRole('admin', 'agent', 'user'), asyncHandler(favoriteController.remove));
router.delete('/',         requireRole('admin', 'agent', 'user'), asyncHandler(favoriteController.removeByProperty));

module.exports = router;