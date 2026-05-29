const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const favoriteController = require('../controllers/favoriteController');

const router = express.Router();

router.get('/:user_id', asyncHandler(favoriteController.getByUser));
router.post('/', asyncHandler(favoriteController.create));
router.delete('/item/:id', asyncHandler(favoriteController.remove));
router.delete('/', asyncHandler(favoriteController.removeByProperty));

module.exports = router;