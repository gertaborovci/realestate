const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/authMiddleware');
const {
  getAllNeighborhoods,
  createNeighborhood,
  updateNeighborhood,
  deleteNeighborhood,
} = require('../controllers/neighborhoodController');

const router = express.Router();

router.get('/',       asyncHandler(getAllNeighborhoods));                            // public
router.post('/',      requireRole('admin'), asyncHandler(createNeighborhood));      // admin only
router.put('/:id',    requireRole('admin'), asyncHandler(updateNeighborhood));      // admin only
router.delete('/:id', requireRole('admin'), asyncHandler(deleteNeighborhood));      // admin only

module.exports = router;
