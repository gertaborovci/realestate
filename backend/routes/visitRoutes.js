const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/authMiddleware');
const visitController = require('../controllers/visitController');

const router = express.Router();

router.get('/', asyncHandler(visitController.getAll));
router.get('/user/:user_id', asyncHandler(visitController.getByUser));
router.get('/agent/:agent_id', asyncHandler(visitController.getByAgent));
router.get('/agent/:agent_id/consultations', asyncHandler(visitController.getConsultationsByAgent));
router.get('/property/:property_id', asyncHandler(visitController.getByProperty));
router.get('/:id', asyncHandler(visitController.getById));
router.post('/', asyncHandler(visitController.create));
router.put('/:id', requireRole('admin', 'agent'), asyncHandler(visitController.update));
router.delete('/:id', requireRole('admin', 'agent', 'user'), asyncHandler(visitController.remove));

module.exports = router;
