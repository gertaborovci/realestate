const db = require('../db');

// ── READ all ─────────────────────────────────────────────────────────────────
async function getAllExpenses(req, res) {
  try {
    const [rows] = await db.query(
      'SELECT * FROM agencyexpenses ORDER BY expense_date DESC, created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expenses.' });
  }
}

// ── CREATE ───────────────────────────────────────────────────────────────────
async function createExpense(req, res) {
  try {
    const { category, amount, description, expense_date } = req.body;

    if (!amount || !expense_date) {
      return res.status(400).json({ error: 'Amount and date are required.' });
    }

    const [result] = await db.query(
      'INSERT INTO agencyexpenses (category, amount, description, expense_date) VALUES (?, ?, ?, ?)',
      [category?.trim() || 'Other', Number(amount), description?.trim() || null, expense_date]
    );

    res.status(201).json({ id: result.insertId, message: 'Expense created.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create expense.' });
  }
}

// ── UPDATE ───────────────────────────────────────────────────────────────────
async function updateExpense(req, res) {
  try {
    const { category, amount, description, expense_date } = req.body;

    if (!amount || !expense_date) {
      return res.status(400).json({ error: 'Amount and date are required.' });
    }

    const [result] = await db.query(
      'UPDATE agencyexpenses SET category = ?, amount = ?, description = ?, expense_date = ? WHERE id = ?',
      [category?.trim() || 'Other', Number(amount), description?.trim() || null, expense_date, req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    res.json({ message: 'Expense updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update expense.' });
  }
}

// ── DELETE ───────────────────────────────────────────────────────────────────
async function deleteExpense(req, res) {
  try {
    const [result] = await db.query(
      'DELETE FROM agencyexpenses WHERE id = ?',
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    res.json({ message: 'Expense deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete expense.' });
  }
}

module.exports = { getAllExpenses, createExpense, updateExpense, deleteExpense };
