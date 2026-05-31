const db = require('../db');

// GET /api/offices  — public: active offices only
async function getAll(req, res) {
  const [rows] = await db.query(
    'SELECT * FROM offices WHERE is_active = 1 ORDER BY id ASC'
  );
  res.json(rows);
}

// GET /api/offices/all  — admin: every office including inactive
async function getAllAdmin(req, res) {
  const [rows] = await db.query('SELECT * FROM offices ORDER BY id ASC');
  res.json(rows);
}

// GET /api/offices/:id
async function getById(req, res) {
  const [[row]] = await db.query('SELECT * FROM offices WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Office not found.' });
  res.json(row);
}

// POST /api/offices
async function create(req, res) {
  const { name, address, city, phone, email, working_hours, map_url, is_active } = req.body;
  if (!name || !address || !city) {
    return res.status(400).json({ error: 'name, address and city are required.' });
  }
  const [result] = await db.query(
    `INSERT INTO offices (name, address, city, phone, email, working_hours, map_url, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name.trim(),
      address.trim(),
      city.trim(),
      phone        || null,
      email        || null,
      working_hours || null,
      map_url      || null,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
    ]
  );
  res.status(201).json({ id: result.insertId, ...req.body });
}

// PUT /api/offices/:id
async function update(req, res) {
  const [[current]] = await db.query('SELECT * FROM offices WHERE id = ?', [req.params.id]);
  if (!current) return res.status(404).json({ error: 'Office not found.' });

  const name          = req.body.name          ?? current.name;
  const address       = req.body.address       ?? current.address;
  const city          = req.body.city          ?? current.city;
  const phone         = 'phone'         in req.body ? (req.body.phone         || null) : current.phone;
  const email         = 'email'         in req.body ? (req.body.email         || null) : current.email;
  const working_hours = 'working_hours' in req.body ? (req.body.working_hours || null) : current.working_hours;
  const map_url       = 'map_url'       in req.body ? (req.body.map_url       || null) : current.map_url;
  const is_active     = req.body.is_active !== undefined ? (req.body.is_active ? 1 : 0) : current.is_active;

  await db.query(
    `UPDATE offices SET name=?, address=?, city=?, phone=?, email=?, working_hours=?, map_url=?, is_active=? WHERE id=?`,
    [name, address, city, phone, email, working_hours, map_url, is_active, req.params.id]
  );
  res.json({ message: 'Office updated.' });
}

// DELETE /api/offices/:id
async function remove(req, res) {
  const [result] = await db.query('DELETE FROM offices WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Office not found.' });
  res.json({ message: 'Office deleted.' });
}

module.exports = { getAll, getAllAdmin, getById, create, update, remove };
