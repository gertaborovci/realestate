const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/authMiddleware');
const c = require('../controllers/qaController');

const router = express.Router();

// Public: Q&A for a property (auto fallback logic)
router.get('/property/:property_id',          asyncHandler(c.getForProperty));

// Agent global Q&A — read is public, writes require agent/admin
router.get('/agent/:agent_id/global',         asyncHandler(c.getAgentGlobal));
router.post('/global',                        requireRole('admin', 'agent'), asyncHandler(c.createGlobal));
router.put('/global/:id',                     requireRole('admin', 'agent'), asyncHandler(c.updateGlobal));
router.delete('/global/:id',                  requireRole('admin', 'agent'), asyncHandler(c.removeGlobal));

// Property-specific Q&A
router.get('/property/:property_id/specific', asyncHandler(c.getPropertySpecific));
router.post('/specific',                      requireRole('admin', 'agent'), asyncHandler(c.createPropertySpecific));
router.put('/specific/:id',                   requireRole('admin', 'agent'), asyncHandler(c.updatePropertySpecific));
router.delete('/specific/:id',                requireRole('admin', 'agent'), asyncHandler(c.removePropertySpecific));
router.delete('/property/:property_id/clear', requireRole('admin', 'agent'), asyncHandler(c.clearPropertyQA));

// Exclusions
router.get('/exclusions/:agent_id',           requireRole('admin', 'agent'), asyncHandler(c.getExclusions));
router.post('/exclusions/toggle',             requireRole('admin', 'agent'), asyncHandler(c.toggleExclusion));

module.exports = router;
