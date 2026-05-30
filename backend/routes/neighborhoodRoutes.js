const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  getAllNeighborhoods,
  createNeighborhood,
  updateNeighborhood,
  deleteNeighborhood,
} = require('../controllers/neighborhoodController');

const router = express.Router();

router.get('/',      asyncHandler(getAllNeighborhoods));   // READ   all
router.post('/',     asyncHandler(createNeighborhood));    // CREATE
router.put('/:id',   asyncHandler(updateNeighborhood));    // UPDATE
router.delete('/:id',asyncHandler(deleteNeighborhood));    // DELETE

module.exports = router;
