const db = require('../db');

async function getAll(req, res) {
  const [rows] = await db.query('SELECT * FROM searchalerts ORDER BY data_krijimit DESC');
  res.json(rows);
}

async function create(req, res) {
  const { client_id, qyteti, cmimi_max } = req.body;
  const [result] = await db.query(
    'INSERT INTO searchalerts (client_id, qyteti, cmimi_max) VALUES (?, ?, ?)',
    [client_id || 1, qyteti, cmimi_max]
  );
  res.status(201).json({ id: result.insertId, message: 'Alert saved successfully.' });
}

module.exports = { getAll, create };
