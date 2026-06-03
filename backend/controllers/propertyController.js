const db = require('../db');
const { notifyMatchingAlerts } = require('./searchAlertController');

async function getAll(req, res) {
  // Pagination: ?page=1&limit=20  (limit capped at 100)
  const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM properties');

  const [results] = await db.query(`
    SELECT p.*,
           u.username   AS agent_name,
           u.email      AS agent_email,
           u.phone      AS agent_phone,
           u.photo_url  AS agent_photo,
           n.name       AS neighborhood_name,
           n.city       AS neighborhood_city,
           n.safety_score, n.schools_score, n.transport_score,
           n.avg_price  AS neighborhood_avg_price
    FROM properties p
    LEFT JOIN agents        a ON p.agent_id       = a.id
    LEFT JOIN users         u ON a.user_id         = u.id
    LEFT JOIN neighborhoods n ON p.neighborhood_id = n.id
    ORDER BY p.id DESC
    LIMIT ? OFFSET ?
  `, [limit, offset]);

  res.status(200).json({
    data:  results,
    total: Number(total),
    page,
    pages: Math.ceil(Number(total) / limit),
    limit,
  });
}

async function getById(req, res) {
  const [result] = await db.query('SELECT * FROM properties WHERE id = ?', [req.params.id]);
  if (!result.length) return res.status(404).json({ message: 'Property not found.' });
  res.status(200).json(result[0]);
}

async function create(req, res) {
  const { title, price, location, latitude, longitude, status, type, home_type, neighborhood_id, image, rooms, bathrooms, area, agent_id } = req.body;

  // Input validation
  if (!title || !title.trim())    return res.status(400).json({ error: 'Title is required.' });
  if (!location || !location.trim()) return res.status(400).json({ error: 'Location is required.' });
  if (price == null || isNaN(Number(price)) || Number(price) < 0)
    return res.status(400).json({ error: 'A valid price is required.' });

  const [result] = await db.query(
    `INSERT INTO properties
       (title, price, location, latitude, longitude, status, type, home_type, neighborhood_id, image, rooms, bathrooms, area, agent_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title.trim(), Number(price), location.trim(), latitude || null, longitude || null,
     status || 'Available', type || 'BUY', home_type || null, neighborhood_id || null,
     image || '', rooms || null, bathrooms || null, area || null, agent_id || null]
  );
  // Fire notifications to users whose search alerts match this new property
  notifyMatchingAlerts({ title, location, price, rooms, type });

  res.status(201).json({ id: result.insertId, ...req.body });
}

async function update(req, res) {
  const { title, price, location, latitude, longitude, status, type, home_type, neighborhood_id, image, rooms, bathrooms, area, agent_id } = req.body;
  await db.query(
    `UPDATE properties
     SET title = ?, price = ?, location = ?, latitude = ?, longitude = ?,
         status = ?, type = ?, home_type = ?, neighborhood_id = ?,
         image = ?, rooms = ?, bathrooms = ?, area = ?,
         agent_id = COALESCE(?, agent_id)
     WHERE id = ?`,
    [title, price, location, latitude || null, longitude || null,
     status, type, home_type || null, neighborhood_id || null,
     image, rooms, bathrooms, area, agent_id || null, req.params.id]
  );
  res.status(200).json({ message: 'Property updated successfully.' });
}

async function getByAgent(req, res) {
  const [results] = await db.query(
    'SELECT * FROM properties WHERE agent_id = ? ORDER BY id DESC',
    [req.params.agentId]
  );
  res.status(200).json(results);
}

async function remove(req, res) {
  await db.query('DELETE FROM properties WHERE id = ?', [req.params.id]);
  res.status(200).json({ message: 'Property deleted successfully.' });
}

module.exports = { getAll, getById, getByAgent, create, update, remove };
