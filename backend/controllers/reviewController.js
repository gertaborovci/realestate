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

module.exports = { getByAgent, getAll, create };
