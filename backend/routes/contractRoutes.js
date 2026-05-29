const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const c = require('../controllers/contractController');

const router = express.Router();

router.get('/',                  asyncHandler(c.getAll));
router.get('/agent/:agent_id',   asyncHandler(c.getByAgent));
router.get('/buyer/:user_id',    asyncHandler(c.getByBuyer));
router.get('/:id',               asyncHandler(c.getOne));
router.post('/',                 asyncHandler(c.create));
router.put('/:id',               asyncHandler(c.update));
router.put('/:id/status',        asyncHandler(c.updateStatus));
router.put('/:id/sign',          asyncHandler(c.markSigned));
router.put('/:id/notes',         asyncHandler(c.updateNotes));
router.delete('/:id',            asyncHandler(c.remove));

module.exports = router;
