const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const ratingController = require('../controllers/ratingController');

const router = express.Router();

router.get('/agent/:agent_id',    asyncHandler(ratingController.getByAgent));
router.get('/user/:user_id',      asyncHandler(ratingController.getByUser));
router.post('/',                  asyncHandler(ratingController.upsert));
router.put('/:id',                asyncHandler(ratingController.update));
router.delete('/admin/:id',       asyncHandler(ratingController.removeAsAdmin));
router.delete('/:id',             asyncHandler(ratingController.remove));

module.exports = router;