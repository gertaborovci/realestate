const db = require('../db');

// ── Get Q&A for a specific property ──────────────────────────────────────────
// Logic: property-specific > agent global (unless excluded)
async function getForProperty(req, res) {
  const { property_id } = req.params;

  // Get the property's agent_id
  const [[prop]] = await db.query('SELECT agent_id FROM properties WHERE id = ?', [property_id]);
  if (!prop) return res.status(404).json({ error: 'Property not found.' });
  if (!prop.agent_id) return res.json([]);

  // Check for property-specific Q&A
  const [specific] = await db.query(
    'SELECT * FROM property_qa WHERE property_id = ? ORDER BY sort_order ASC',
    [property_id]
  );
  if (specific.length > 0) return res.json(specific.map(s => ({ ...s, _source: 'property' })));

  // Check if this property is excluded from global Q&A
  const [[excl]] = await db.query(
    'SELECT id FROM qa_exclusions WHERE agent_id = ? AND property_id = ?',
    [prop.agent_id, property_id]
  );
  if (excl) return res.json([]); // excluded — no Q&A

  // Fall back to agent's global Q&A
  const [global] = await db.query(
    'SELECT * FROM agent_qa WHERE agent_id = ? ORDER BY sort_order ASC',
    [prop.agent_id]
  );
  res.json(global.map(g => ({ ...g, _source: 'global' })));
}

// ── Agent global Q&A ──────────────────────────────────────────────────────────
async function getAgentGlobal(req, res) {
  const [rows] = await db.query(
    'SELECT * FROM agent_qa WHERE agent_id = ? ORDER BY sort_order ASC',
    [req.params.agent_id]
  );
  res.json(rows);
}

async function createGlobal(req, res) {
  const { agent_id, question, answer, sort_order } = req.body;
  if (!agent_id || !question || !answer) {
    return res.status(400).json({ error: 'agent_id, question and answer are required.' });
  }
  const [result] = await db.query(
    'INSERT INTO agent_qa (agent_id, question, answer, sort_order) VALUES (?, ?, ?, ?)',
    [agent_id, question.trim(), answer.trim(), sort_order ?? 0]
  );
  res.status(201).json({ id: result.insertId, message: 'Q&A item added.' });
}

// ── Property-specific Q&A ─────────────────────────────────────────────────────
async function getPropertySpecific(req, res) {
  const [rows] = await db.query(
    'SELECT * FROM property_qa WHERE property_id = ? ORDER BY sort_order ASC',
    [req.params.property_id]
  );
  res.json(rows);
}

async function createPropertySpecific(req, res) {
  const { agent_id, property_id, question, answer, sort_order } = req.body;
  if (!property_id || !question || !answer) {
    return res.status(400).json({ error: 'property_id, question and answer are required.' });
  }
  const [result] = await db.query(
    'INSERT INTO property_qa (agent_id, property_id, question, answer, sort_order) VALUES (?, ?, ?, ?, ?)',
    [agent_id || null, property_id, question.trim(), answer.trim(), sort_order ?? 0]
  );
  res.status(201).json({ id: result.insertId, message: 'Q&A item added.' });
}

// ── Update (works for both tables via type param) ─────────────────────────────
async function updateGlobal(req, res) {
  const { question, answer, sort_order } = req.body;
  const [result] = await db.query(
    'UPDATE agent_qa SET question = ?, answer = ?, sort_order = ? WHERE id = ?',
    [question?.trim(), answer?.trim(), sort_order ?? 0, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Not found.' });
  res.json({ message: 'Updated.' });
}

async function updatePropertySpecific(req, res) {
  const { question, answer, sort_order } = req.body;
  const [result] = await db.query(
    'UPDATE property_qa SET question = ?, answer = ?, sort_order = ? WHERE id = ?',
    [question?.trim(), answer?.trim(), sort_order ?? 0, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Not found.' });
  res.json({ message: 'Updated.' });
}

// ── Delete ────────────────────────────────────────────────────────────────────
async function removeGlobal(req, res) {
  await db.query('DELETE FROM agent_qa WHERE id = ?', [req.params.id]);
  res.json({ message: 'Deleted.' });
}

async function removePropertySpecific(req, res) {
  await db.query('DELETE FROM property_qa WHERE id = ?', [req.params.id]);
  res.json({ message: 'Deleted.' });
}

async function clearPropertyQA(req, res) {
  await db.query('DELETE FROM property_qa WHERE property_id = ?', [req.params.property_id]);
  res.json({ message: 'Property Q&A cleared (reverted to global).' });
}

// ── Exclusions ────────────────────────────────────────────────────────────────
async function getExclusions(req, res) {
  const [rows] = await db.query(
    'SELECT property_id FROM qa_exclusions WHERE agent_id = ?',
    [req.params.agent_id]
  );
  res.json(rows.map(r => r.property_id));
}

async function toggleExclusion(req, res) {
  const { agent_id, property_id } = req.body;
  const [[existing]] = await db.query(
    'SELECT id FROM qa_exclusions WHERE agent_id = ? AND property_id = ?',
    [agent_id, property_id]
  );
  if (existing) {
    await db.query('DELETE FROM qa_exclusions WHERE id = ?', [existing.id]);
    return res.json({ excluded: false });
  }
  await db.query('INSERT INTO qa_exclusions (agent_id, property_id) VALUES (?, ?)', [agent_id, property_id]);
  res.json({ excluded: true });
}

module.exports = {
  getForProperty,
  getAgentGlobal, createGlobal, updateGlobal, removeGlobal,
  getPropertySpecific, createPropertySpecific, updatePropertySpecific,
  removePropertySpecific, clearPropertyQA,
  getExclusions, toggleExclusion,
};
