const db = require('../db');

async function getMaintenance(req, res) {
  const [results] = await db.query('SELECT * FROM MaintenanceTickets ORDER BY created_at DESC');
  res.json(results);
}

async function createMaintenance(req, res) {
  const { property_id, tenant_id, title, description } = req.body;
  const [result] = await db.query(
    'INSERT INTO MaintenanceTickets (property_id, tenant_id, title, description) VALUES (?, ?, ?, ?)',
    [property_id, tenant_id, title, description]
  );
  res.status(201).json({ id: result.insertId, ...req.body, status: 'Pending' });
}

async function updateMaintenance(req, res) {
  const { status } = req.body;
  await db.query('UPDATE MaintenanceTickets SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ message: 'Status updated successfully.' });
}

async function deleteMaintenance(req, res) {
  await db.query('DELETE FROM MaintenanceTickets WHERE id = ?', [req.params.id]);
  res.json({ message: 'Ticket deleted.' });
}

async function getExpenses(req, res) {
  const [results] = await db.query('SELECT * FROM AgencyExpenses ORDER BY expense_date DESC');
  res.json(results);
}

async function createExpense(req, res) {
  const { category, amount, description, expense_date } = req.body;
  const [result] = await db.query(
    'INSERT INTO AgencyExpenses (category, amount, description, expense_date) VALUES (?, ?, ?, ?)',
    [category, amount, description, expense_date]
  );
  res.status(201).json({ id: result.insertId, ...req.body });
}

async function deleteExpense(req, res) {
  await db.query('DELETE FROM AgencyExpenses WHERE id = ?', [req.params.id]);
  res.json({ message: 'Expense deleted.' });
}

module.exports = {
  getMaintenance,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  getExpenses,
  createExpense,
  deleteExpense,
};
