const db = require('../db');

async function getAll(req, res) {
  const [rows] = await db.query('SELECT * FROM testimonials ORDER BY data_publikimit DESC');
  res.json(rows);
}

async function create(req, res) {
  const { klienti_emri, teksti } = req.body;
  if (!teksti) return res.status(400).json({ error: 'Story text is required.' });
  const foto_url = req.file ? `/uploads/${req.file.filename}` : null;
  const [result] = await db.query(
    'INSERT INTO testimonials (klienti_emri, teksti, foto_url) VALUES (?, ?, ?)',
    [klienti_emri || 'Anonymous', teksti, foto_url]
  );
  res.status(201).json({ id: result.insertId, klienti_emri, teksti, foto_url });
}

async function update(req, res) {
  const { klienti_emri, teksti } = req.body;
  if (!teksti) return res.status(400).json({ error: 'Story text is required.' });
  const [result] = await db.query(
    'UPDATE testimonials SET klienti_emri = ?, teksti = ? WHERE id = ?',
    [klienti_emri || 'Anonymous', teksti, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Testimonial not found.' });
  res.json({ message: 'Testimonial updated.' });
}

async function remove(req, res) {
  const [result] = await db.query('DELETE FROM testimonials WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Testimonial not found.' });
  res.json({ message: 'Testimonial deleted.' });
}

module.exports = { getAll, create, update, remove };
