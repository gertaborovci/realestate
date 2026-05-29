const db = require('../db');

async function generateContractNumber() {
  const year = new Date().getFullYear();
  const [[row]] = await db.query(
    'SELECT COUNT(*) AS cnt FROM contracts WHERE YEAR(created_at) = ?',
    [year]
  );
  return `CNT-${year}-${String(row.cnt + 1).padStart(4, '0')}`;
}

const JOINED = `
  SELECT
    c.*,
    u.username   AS client_name,
    u.email      AS client_email,
    p.title      AS property_title,
    p.location   AS property_location,
    au.username  AS agent_name,
    COALESCE(
      (SELECT SUM(t.amount) FROM transactions t
       WHERE t.contract_id = c.id AND t.status = 'Confirmed'), 0
    ) AS total_paid
  FROM contracts c
  LEFT JOIN users      u  ON c.user_id    = u.id
  LEFT JOIN properties p  ON c.property_id = p.id
  LEFT JOIN agents     a  ON c.agent_id   = a.id
  LEFT JOIN users      au ON a.user_id    = au.id
`;

// ── GET all ──────────────────────────────────────────────────────────────────
async function getAll(req, res) {
  const [rows] = await db.query(JOINED + ' ORDER BY c.created_at DESC');
  res.json(rows);
}

// ── GET by agent ─────────────────────────────────────────────────────────────
async function getByAgent(req, res) {
  const [rows] = await db.query(
    JOINED + ' WHERE (c.agent_id = ? OR p.agent_id = ?) ORDER BY c.created_at DESC',
    [req.params.agent_id, req.params.agent_id]
  );
  res.json(rows);
}

// ── GET by buyer (user) ──────────────────────────────────────────────────────
async function getByBuyer(req, res) {
  const [rows] = await db.query(
    JOINED + ' WHERE c.user_id = ? ORDER BY c.created_at DESC',
    [req.params.user_id]
  );
  res.json(rows);
}

// ── GET single contract ──────────────────────────────────────────────────────
async function getOne(req, res) {
  const [rows] = await db.query(
    JOINED + ' WHERE c.id = ? LIMIT 1',
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Contract not found.' });
  res.json(rows[0]);
}

// ── POST create contract + auto-create deposit payment ───────────────────────
async function create(req, res) {
  const { user_id, property_id, agent_id, type } = req.body;
  if (!user_id || !property_id) {
    return res.status(400).json({ error: 'user_id and property_id are required.' });
  }

  // Prevent duplicate open contracts
  const [existing] = await db.query(
    `SELECT id FROM contracts
     WHERE user_id = ? AND property_id = ? AND status NOT IN ('Cancelled','Finalized')`,
    [user_id, property_id]
  );
  if (existing.length > 0) {
    return res.status(409).json({
      error: 'An active contract already exists for this property.',
      contract_id: existing[0].id,
    });
  }

  // Fetch property price
  const [[property]] = await db.query('SELECT price FROM properties WHERE id = ?', [property_id]);
  if (!property) return res.status(404).json({ error: 'Property not found.' });

  const propertyPrice    = Number(property.price);
  const depositAmount    = parseFloat((propertyPrice * 0.2).toFixed(2));
  const remainingBalance = parseFloat((propertyPrice * 0.8).toFixed(2));
  const contractNumber   = await generateContractNumber();
  const today            = new Date().toISOString().split('T')[0];

  // Insert contract
  const [result] = await db.query(
    `INSERT INTO contracts
       (contract_number, user_id, property_id, agent_id, type,
        property_price, deposit_amount, remaining_balance, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending Signature')`,
    [contractNumber, user_id, property_id, agent_id || null,
     type || 'Sale', propertyPrice, depositAmount, remainingBalance]
  );
  const contractId = result.insertId;

  // Auto-create pending deposit payment
  await db.query(
    `INSERT INTO transactions (contract_id, payment_type, amount, payment_date, method, status)
     VALUES (?, 'Deposit', ?, ?, 'Bank Transfer', 'Pending')`,
    [contractId, depositAmount, today]
  );

  res.status(201).json({
    id:                contractId,
    contract_number:   contractNumber,
    status:            'Pending Signature',
    property_price:    propertyPrice,
    deposit_amount:    depositAmount,
    remaining_balance: remainingBalance,
  });
}

// ── PUT full contract update ─────────────────────────────────────────────────
async function update(req, res) {
  const [[current]] = await db.query('SELECT * FROM contracts WHERE id = ?', [req.params.id]);
  if (!current) return res.status(404).json({ error: 'Contract not found.' });

  const type    = req.body.type    ?? current.type;
  const agentId = 'agent_id' in req.body ? (req.body.agent_id || null) : current.agent_id;
  const notes   = 'notes'    in req.body ? (req.body.notes    || null) : current.notes;

  // If price is supplied without explicit deposit/remaining, auto-recalculate
  let price     = req.body.property_price    != null ? Number(req.body.property_price)    : Number(current.property_price);
  let deposit   = req.body.deposit_amount    != null ? Number(req.body.deposit_amount)    : null;
  let remaining = req.body.remaining_balance != null ? Number(req.body.remaining_balance) : null;

  if (req.body.property_price != null && req.body.deposit_amount == null) {
    deposit   = parseFloat((price * 0.2).toFixed(2));
    remaining = parseFloat((price * 0.8).toFixed(2));
  } else {
    deposit   = deposit   ?? Number(current.deposit_amount);
    remaining = remaining ?? Number(current.remaining_balance);
  }

  await db.query(
    `UPDATE contracts
     SET type = ?, property_price = ?, deposit_amount = ?, remaining_balance = ?, notes = ?, agent_id = ?
     WHERE id = ?`,
    [type, price, deposit, remaining, notes, agentId, req.params.id]
  );

  res.json({ message: 'Contract updated.', deposit_amount: deposit, remaining_balance: remaining });
}

// ── PUT update status ────────────────────────────────────────────────────────
async function updateStatus(req, res) {
  const { status } = req.body;
  const valid = ['Pending Signature', 'Active', 'Finalized', 'Cancelled'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${valid.join(', ')}` });
  }
  const [result] = await db.query(
    'UPDATE contracts SET status = ? WHERE id = ?',
    [status, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Contract not found.' });
  res.json({ message: 'Status updated.' });
}

// ── PUT mark as signed by buyer or agent ─────────────────────────────────────
async function markSigned(req, res) {
  const { party } = req.body; // 'buyer' | 'agent'
  if (!['buyer', 'agent'].includes(party)) {
    return res.status(400).json({ error: "party must be 'buyer' or 'agent'." });
  }
  const col = party === 'buyer' ? 'signed_by_buyer' : 'signed_by_agent';
  await db.query(`UPDATE contracts SET ${col} = 1 WHERE id = ?`, [req.params.id]);

  // Auto-finalize when both have signed
  const [[c]] = await db.query(
    'SELECT signed_by_buyer, signed_by_agent, status FROM contracts WHERE id = ?',
    [req.params.id]
  );
  let finalized = false;
  if (c && c.signed_by_buyer && c.signed_by_agent && c.status !== 'Cancelled') {
    await db.query("UPDATE contracts SET status = 'Finalized' WHERE id = ?", [req.params.id]);
    finalized = true;
  }
  res.json({ message: `Signed by ${party}.`, finalized });
}

// ── PUT update notes ─────────────────────────────────────────────────────────
async function updateNotes(req, res) {
  const { notes } = req.body;
  const [result] = await db.query(
    'UPDATE contracts SET notes = ? WHERE id = ?',
    [notes ?? null, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Contract not found.' });
  res.json({ message: 'Notes updated.' });
}

// ── DELETE contract ──────────────────────────────────────────────────────────
async function remove(req, res) {
  const [result] = await db.query('DELETE FROM contracts WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Contract not found.' });
  res.json({ message: 'Contract deleted.' });
}

module.exports = {
  getAll, getByAgent, getByBuyer, getOne,
  create, update, updateStatus, markSigned, updateNotes, remove,
};
