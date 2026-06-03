const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/authMiddleware');
const {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');

const router = express.Router();

// Expenses are admin/agent financial data — require authentication
router.get('/',       requireRole('admin', 'agent'), asyncHandler(getAllExpenses));
router.post('/',      requireRole('admin', 'agent'), asyncHandler(createExpense));
router.put('/:id',    requireRole('admin', 'agent'), asyncHandler(updateExpense));
router.delete('/:id', requireRole('admin'),           asyncHandler(deleteExpense));

module.exports = router;
