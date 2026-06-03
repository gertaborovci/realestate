const db = require('../db');

async function getByAgent(req, res) {
  const [results] = await db.query('SELECT * FROM reviews WHERE agent_id = ? ORDER BY created_at DESC', [req.params.agent_id]);
  res.json(results);
}

async function getAll(req, res) {
  const [results] = await db.query('SELECT * FROM reviews ORDER BY created_at DESC');
  res.json(results);
}

async function create(req, res) {
  const { agent_id, client_id, vleresimi, komenti } = req.body;
  const [result] = await db.query(
    'INSERT INTO reviews (agent_id, client_id, vleresimi, komenti) VALUES (?, ?, ?, ?)',
    [agent_id || 1, client_id || 1, vleresimi, komenti]
  );
  res.status(201).json({ message: 'Review added successfully.', id: result.insertId });
}

async function update(req, res) {
  const { vleresimi, komenti } = req.body;
  if (vleresimi == null && komenti == null) {
    return res.status(400).json({ error: 'Provide at least one field to update.' });
  }
  const [result] = await db.query(
    'UPDATE reviews SET vleresimi = COALESCE(?, vleresimi), komenti = COALESCE(?, komenti) WHERE id = ?',
    [vleresimi ?? null, komenti ?? null, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Review not found.' });
  res.json({ message: 'Review updated.' });
}

async function remove(req, res) {
  const [result] = await db.query('DELETE FROM reviews WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Review not found.' });
  res.json({ message: 'Review deleted.' });
}

module.exports = { getByAgent, getAll, create, update, remove };
