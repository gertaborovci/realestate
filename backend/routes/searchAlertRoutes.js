const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const c = require('../controllers/searchAlertController');

const router = express.Router();

router.get('/',                     asyncHandler(c.getAll));       // admin: all alerts
router.get('/user/:user_id',        asyncHandler(c.getByUser));    // user: own alerts
router.post('/',                    asyncHandler(c.create));       // create
router.put('/:id',                  asyncHandler(c.update));       // update
router.delete('/:id',               asyncHandler(c.remove));       // delete

module.exports = router;
