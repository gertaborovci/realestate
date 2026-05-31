const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const c = require('../controllers/propertyReviewController');

const router = express.Router();

router.get('/property/:property_id', asyncHandler(c.getByProperty)); // public
router.get('/user/:user_id',         asyncHandler(c.getByUser));      // user dashboard
router.get('/',                      asyncHandler(c.getAll));          // admin
router.post('/',                     asyncHandler(c.create));
router.put('/:id',                   asyncHandler(c.update));
router.delete('/:id',                asyncHandler(c.remove));

module.exports = router;
