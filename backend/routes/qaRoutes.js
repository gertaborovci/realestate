const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const c = require('../controllers/qaController');

const router = express.Router();

// Public: Q&A for a property (auto fallback logic)
router.get('/property/:property_id',         asyncHandler(c.getForProperty));

// Agent global Q&A
router.get('/agent/:agent_id/global',        asyncHandler(c.getAgentGlobal));
router.post('/global',                       asyncHandler(c.createGlobal));
router.put('/global/:id',                    asyncHandler(c.updateGlobal));
router.delete('/global/:id',                 asyncHandler(c.removeGlobal));

// Property-specific Q&A
router.get('/property/:property_id/specific',asyncHandler(c.getPropertySpecific));
router.post('/specific',                     asyncHandler(c.createPropertySpecific));
router.put('/specific/:id',                  asyncHandler(c.updatePropertySpecific));
router.delete('/specific/:id',               asyncHandler(c.removePropertySpecific));
router.delete('/property/:property_id/clear',asyncHandler(c.clearPropertyQA));

// Exclusions
router.get('/exclusions/:agent_id',          asyncHandler(c.getExclusions));
router.post('/exclusions/toggle',            asyncHandler(c.toggleExclusion));

module.exports = router;
