const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const propertyController = require('../controllers/propertyController');
const imageController = require('../controllers/imageController');
const upload = require('../config/upload');

const router = express.Router();

router.get('/', asyncHandler(propertyController.getAll));
router.post('/', asyncHandler(propertyController.create));

router.get('/agent/:agentId', asyncHandler(propertyController.getByAgent)); // must be before /:id

router.get('/:id/images', asyncHandler(imageController.getByProperty));
router.post('/:id/images', upload.single('image'), asyncHandler(imageController.upload));
router.delete('/images/:image_id', asyncHandler(imageController.remove));
router.put('/images/:image_id/set-main', asyncHandler(imageController.setMain));

router.get('/:id', asyncHandler(propertyController.getById));
router.put('/:id', asyncHandler(propertyController.update));
router.delete('/:id', asyncHandler(propertyController.remove));

module.exports = router;