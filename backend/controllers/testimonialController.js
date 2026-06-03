const db = require('../db');

async function getAll(req, res) {
  const [rows] = await db.query('SELECT * FROM testimonials ORDER BY data_publikimit DESC');
  res.json(rows);
}

async function create(req, res) {
  const { klienti_emri, teksti, user_id } = req.body;
  if (!teksti) return res.status(400).json({ error: 'Story text is required.' });
  const foto_url = req.file ? `/uploads/${req.file.filename}` : null;
  const [result] = await db.query(
    'INSERT INTO testimonials (klienti_emri, teksti, foto_url, user_id) VALUES (?, ?, ?, ?)',
    [klienti_emri || 'Anonymous', teksti, foto_url, user_id || null]
  );
  res.status(201).json({ id: result.insertId, klienti_emri, teksti, foto_url, user_id });
}

async function update(req, res) {
  const [[existing]] = await db.query('SELECT user_id FROM testimonials WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Testimonial not found.' });
  if (req.authUser?.role !== 'admin' && existing.user_id !== req.authUser?.id) {
    return res.status(403).json({ error: 'Insufficient permissions.' });
  }

  // req.body can be undefined when multer processes multipart/form-data — guard against it
  const body = req.body || {};
  const klienti_emri = body.klienti_emri;
  const teksti       = body.teksti;
  const foto_url     = body.foto_url;

  if (!teksti) return res.status(400).json({ error: 'Story text is required.' });

  // New photo uploaded via multer
  if (req.file) {
    const newFotoUrl = `/uploads/${req.file.filename}`;
    const [result] = await db.query(
      'UPDATE testimonials SET klienti_emri = ?, teksti = ?, foto_url = ? WHERE id = ?',
      [klienti_emri || 'Anonymous', teksti, newFotoUrl, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Testimonial not found.' });
    return res.json({ message: 'Testimonial updated.', foto_url: newFotoUrl });
  }

  // foto_url explicitly provided (could be null to clear, or a URL to keep)
  if (foto_url !== undefined) {
    const [result] = await db.query(
      'UPDATE testimonials SET klienti_emri = ?, teksti = ?, foto_url = ? WHERE id = ?',
      [klienti_emri || 'Anonymous', teksti, foto_url || null, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Testimonial not found.' });
    return res.json({ message: 'Testimonial updated.', foto_url: foto_url || null });
  }

  // Text-only update — don't touch foto_url
  const [result] = await db.query(
    'UPDATE testimonials SET klienti_emri = ?, teksti = ? WHERE id = ?',
    [klienti_emri || 'Anonymous', teksti, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Testimonial not found.' });
  res.json({ message: 'Testimonial updated.' });
}

async function remove(req, res) {
  const [[existing]] = await db.query('SELECT user_id FROM testimonials WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Testimonial not found.' });
  if (req.authUser?.role !== 'admin' && existing.user_id !== req.authUser?.id) {
    return res.status(403).json({ error: 'Insufficient permissions.' });
  }
  await db.query('DELETE FROM testimonials WHERE id = ?', [req.params.id]);
  res.json({ message: 'Testimonial deleted.' });
}

module.exports = { getAll, create, update, remove };
