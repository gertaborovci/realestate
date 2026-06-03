const db = require('../db');

async function getAll(req, res) {
  // Pagination: ?page=1&limit=20  (limit capped at 100)
  const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const [[{ total }]] = await db.query(
    "SELECT COUNT(*) AS total FROM agents WHERE status = 'Active'"
  );

  const [agents] = await db.query(`
    SELECT
      a.id,
      a.user_id,
      a.license_number,
      a.specialization,
      a.commission_percentage,
      a.zone,
      a.status,
      a.bio,
      a.phone,
      a.profile_image,
      a.deals_closed,
      a.happy_clients,
      a.joined_year,
      u.username,
      u.email,
      COALESCE((
        SELECT COUNT(*) FROM certifications c WHERE c.agent_id = a.id
      ), 0) AS cert_count,
      COALESCE((
        SELECT COUNT(*) FROM certifications c
        WHERE c.agent_id = a.id AND c.status = 'Verified'
      ), 0) AS approved_certs,
      COALESCE((
        SELECT ROUND(AVG(ar.rating), 1)
        FROM agent_ratings ar WHERE ar.agent_id = a.id
      ), 5) AS avg_rating,
      u.photo_url
    FROM agents a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.status = 'Active'
    ORDER BY a.id ASC
    LIMIT ? OFFSET ?
  `, [limit, offset]);

  res.json({
    data:  agents,
    total: Number(total),
    page,
    pages: Math.ceil(Number(total) / limit),
    limit,
  });
}

async function getById(req, res) {
  const [agents] = await db.query(`
    SELECT
      a.id,
      a.user_id,
      a.license_number,
      a.specialization,
      a.commission_percentage,
      a.zone,
      a.status,
      a.bio,
      a.phone,
      a.profile_image,
      a.deals_closed,
      a.happy_clients,
      a.joined_year,
      u.username,
      u.email,
      u.photo_url
    FROM agents a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.id = ?
  `, [req.params.id]);

  if (!agents.length) return res.status(404).json({ error: 'Agent not found.' });
  res.json(agents[0]);
}

async function create(req, res) {
  const {
    user_id, license_number, specialization,
    commission_percentage, zone, status,
    bio, phone, profile_image, deals_closed, happy_clients, joined_year,
  } = req.body;

  // Input validation
  if (!user_id) return res.status(400).json({ error: 'user_id is required.' });
  if (!license_number || !license_number.trim())
    return res.status(400).json({ error: 'license_number is required.' });

  const [result] = await db.query(
    `INSERT INTO agents
       (user_id, license_number, specialization, commission_percentage,
        zone, status, bio, phone, profile_image, deals_closed, happy_clients, joined_year)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user_id, license_number, specialization,
      commission_percentage, zone, status || 'Active',
      bio || null, phone || null, profile_image || null,
      deals_closed || 0, happy_clients || 0, joined_year || null,
    ]
  );
  res.status(201).json({ id: result.insertId, ...req.body });
}

async function update(req, res) {
  const {
    license_number, specialization, commission_percentage,
    zone, status, bio, phone, profile_image,
    deals_closed, happy_clients, joined_year,
  } = req.body;

  const [result] = await db.query(
    `UPDATE agents
     SET license_number       = COALESCE(?, license_number),
         specialization       = COALESCE(?, specialization),
         commission_percentage = COALESCE(?, commission_percentage),
         zone                 = COALESCE(?, zone),
         status               = COALESCE(?, status),
         bio                  = COALESCE(?, bio),
         phone                = COALESCE(?, phone),
         profile_image        = COALESCE(?, profile_image),
         deals_closed         = COALESCE(?, deals_closed),
         happy_clients        = COALESCE(?, happy_clients),
         joined_year          = COALESCE(?, joined_year)
     WHERE id = ?`,
    [
      license_number, specialization, commission_percentage,
      zone, status, bio, phone, profile_image,
      deals_closed, happy_clients, joined_year,
      req.params.id,
    ]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Agent not found.' });
  res.json({ message: 'Agent updated successfully.' });
}

async function remove(req, res) {
  const [result] = await db.query('DELETE FROM agents WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Agent not found.' });
  res.json({ message: 'Agent deleted successfully.' });
}

/** Resolve the agents.id that belongs to a given users.id */
async function getByUserId(req, res) {
  const [agents] = await db.query(
    `SELECT a.id, a.user_id, a.license_number, a.specialization, a.zone, a.status,
            u.username, u.email
     FROM agents a
     LEFT JOIN users u ON a.user_id = u.id
     WHERE a.user_id = ?
     LIMIT 1`,
    [req.params.user_id]
  );
  if (!agents.length) return res.status(404).json({ error: 'No agent record found for this user.' });
  res.json(agents[0]);
}

module.exports = { getAll, getById, getByUserId, create, update, remove };