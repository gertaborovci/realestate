const db = require('../db');

const JOINED = `
  SELECT
    t.*,
    c.contract_number AS contract_number,
    c.type            AS contract_type,
    c.status          AS contract_status,
    p.title           AS property_title,
    p.price           AS property_price,
    u.username        AS client_name
  FROM transactions t
  LEFT JOIN contracts  c ON t.contract_id = c.id
  LEFT JOIN properties p ON c.property_id = p.id
  LEFT JOIN users      u ON c.user_id     = u.id
`;

// ── GET all ──────────────────────────────────────────────────────────────────
async function getAll(req, res) {
  const [rows] = await db.query(JOINED + ' ORDER BY t.created_at DESC');
  res.json(rows);
}

// ── GET by contract ──────────────────────────────────────────────────────────
async function getByContract(req, res) {
  const [rows] = await db.query(
    JOINED + ' WHERE t.contract_id = ? ORDER BY t.created_at DESC',
    [req.params.contract_id]
  );
  res.json(rows);
}

// ── GET by agent (all payments linked to agent's contracts) ──────────────────
async function getByAgent(req, res) {
  const [rows] = await db.query(
    JOINED + ' WHERE c.agent_id = ? ORDER BY t.created_at DESC',
    [req.params.agent_id]
  );
  res.json(rows);
}

// ── POST create payment ──────────────────────────────────────────────────────
async function create(req, res) {
  const { contract_id, amount, payment_date, method, status, payment_type, notes } = req.body;
  if (!contract_id || !amount || !payment_date) {
    return res.status(400).json({ error: 'contract_id, amount, and payment_date are required.' });
  }

  const txStatus   = status       || 'Pending';
  const txType     = payment_type || 'Deposit';

  const [result] = await db.query(
    `INSERT INTO transactions (contract_id, payment_type, amount, payment_date, method, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [contract_id, txType, amount, payment_date, method || 'Bank Transfer', txStatus, notes || null]
  );

  // Auto-promote contract to Active when a Confirmed payment is recorded
  if (txStatus === 'Confirmed') {
    await db.query(
      `UPDATE contracts SET status = 'Active'
       WHERE id = ? AND status = 'Pending Signature'`,
      [contract_id]
    );
  }

  res.status(201).json({
    id: result.insertId,
    contract_id,
    payment_type: txType,
    amount,
    payment_date,
    method: method || 'Bank Transfer',
    status: txStatus,
  });
}

// ── PUT full update ───────────────────────────────────────────────────────────
async function update(req, res) {
  const { amount, payment_date, method, payment_type, notes } = req.body;
  if (!amount && !payment_date && !method && !payment_type && !notes) {
    return res.status(400).json({ error: 'Provide at least one field to update.' });
  }

  const [rows] = await db.query('SELECT * FROM transactions WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Payment not found.' });

  const current = rows[0];
  await db.query(
    `UPDATE transactions
       SET amount       = COALESCE(?, amount),
           payment_date = COALESCE(?, payment_date),
           method       = COALESCE(?, method),
           payment_type = COALESCE(?, payment_type),
           notes        = COALESCE(?, notes)
     WHERE id = ?`,
    [amount ?? null, payment_date ?? null, method ?? null,
     payment_type ?? null, notes ?? null, req.params.id]
  );
  res.json({ message: 'Payment updated.' });
}

// ── PUT update status (also auto-promotes contract) ───────────────────────────
async function updateStatus(req, res) {
  const { status } = req.body;
  const valid = ['Pending', 'Confirmed', 'Refunded'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${valid.join(', ')}` });
  }

  const [rows] = await db.query('SELECT * FROM transactions WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Payment not found.' });

  await db.query('UPDATE transactions SET status = ? WHERE id = ?', [status, req.params.id]);

  if (status === 'Confirmed') {
    await db.query(
      `UPDATE contracts SET status = 'Active'
       WHERE id = ? AND status = 'Pending Signature'`,
      [rows[0].contract_id]
    );
  }

  res.json({ message: 'Payment status updated.' });
}

// ── DELETE payment ────────────────────────────────────────────────────────────
async function remove(req, res) {
  const [result] = await db.query('DELETE FROM transactions WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Payment not found.' });
  res.json({ message: 'Payment deleted.' });
}

module.exports = { getAll, getByContract, getByAgent, create, update, updateStatus, remove };
