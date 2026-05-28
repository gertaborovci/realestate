const db = require('../db');

async function getAll(req, res) {
  const [rows] = await db.query('SELECT * FROM testimonials ORDER BY data_publikimit DESC');
  res.json(rows);
}

async function create(req, res) {
  const { klienti_emri, teksti } = req.body;
  if (!teksti) return res.status(400).json({ error: 'Story text is required.' });
  const [result] = await db.query(
    'INSERT INTO testimonials (klienti_emri, teksti) VALUES (?, ?)',
    [klienti_emri || 'Anonymous', teksti]
  );
  res.status(201).json({ id: result.insertId, klienti_emri, teksti });
}

module.exports = { getAll, create };
