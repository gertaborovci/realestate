const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/authMiddleware');
const ratingController = require('../controllers/ratingController');

const router = express.Router();

router.get('/agent/:agent_id',  asyncHandler(ratingController.getByAgent));                               // public
router.get('/user/:user_id',    requireRole('admin', 'agent', 'user'), asyncHandler(ratingController.getByUser));
router.post('/',                requireRole('admin', 'agent', 'user'), asyncHandler(ratingController.upsert));
router.put('/:id',              requireRole('admin', 'agent', 'user'), asyncHandler(ratingController.update));
router.delete('/admin/:id',     requireRole('admin'),                  asyncHandler(ratingController.removeAsAdmin));
router.delete('/:id',           requireRole('admin', 'agent', 'user'), asyncHandler(ratingController.remove));

module.exports = router;