const db = require('../db');

async function getAll(req, res) {
  const [results] = await db.query('SELECT * FROM clients');
  res.json(results);
}

async function create(req, res) {
  const { user_id, emri, mbiemri, telefoni, email, buxheti_max, preferencat, lloji_klientit } = req.body;
  const [result] = await db.query(
    `INSERT INTO clients (user_id, emri, mbiemri, telefoni, email, buxheti_max, preferencat, lloji_klientit)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [user_id, emri, mbiemri, telefoni, email, buxheti_max, preferencat, lloji_klientit]
  );
  res.status(201).json({ message: 'Client created successfully.', id: result.insertId });
}

async function update(req, res) {
  const { buxheti_max, preferencat, phone, address } = req.body;
  if (phone !== undefined || address !== undefined) {
    await db.query('UPDATE clients SET phone = ?, address = ? WHERE id = ?', [phone, address, req.params.id]);
  } else {
    await db.query('UPDATE clients SET buxheti_max = ?, preferencat = ? WHERE id = ?', [buxheti_max, preferencat, req.params.id]);
  }
  res.json({ message: 'Client updated successfully.' });
}

async function remove(req, res) {
  await db.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
  res.json({ message: 'Client deleted successfully.' });
}

module.exports = { getAll, create, update, remove };
