const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');

const router = express.Router();

router.get('/',       asyncHandler(getAllExpenses));  // READ   all
router.post('/',      asyncHandler(createExpense));   // CREATE
router.put('/:id',    asyncHandler(updateExpense));   // UPDATE
router.delete('/:id', asyncHandler(deleteExpense));   // DELETE

module.exports = router;
