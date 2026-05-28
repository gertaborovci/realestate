const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const financeController = require('../controllers/financeController');

const maintenanceRouter = express.Router();
maintenanceRouter.get('/', asyncHandler(financeController.getMaintenance));
maintenanceRouter.post('/', asyncHandler(financeController.createMaintenance));
maintenanceRouter.put('/:id', asyncHandler(financeController.updateMaintenance));
maintenanceRouter.delete('/:id', asyncHandler(financeController.deleteMaintenance));

const expensesRouter = express.Router();
expensesRouter.get('/', asyncHandler(financeController.getExpenses));
expensesRouter.post('/', asyncHandler(financeController.createExpense));
expensesRouter.delete('/:id', asyncHandler(financeController.deleteExpense));

module.exports = { maintenanceRouter, expensesRouter };
