const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/register', asyncHandler(userController.register));
router.post('/login', asyncHandler(userController.login));

module.exports = router;
