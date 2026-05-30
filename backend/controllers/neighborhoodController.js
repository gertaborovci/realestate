const db = require('../db');

// ── READ all ─────────────────────────────────────────────────────────────────
async function getAllNeighborhoods(req, res) {
  try {
    const [rows] = await db.query(
      'SELECT * FROM neighborhoods ORDER BY city ASC, name ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch neighborhoods.' });
  }
}

// ── CREATE ───────────────────────────────────────────────────────────────────
async function createNeighborhood(req, res) {
  try {
    const {
      city, name, description,
      safety_score, schools_score, transport_score, walk_score,
      avg_price, price_per_sqm,
      latitude, longitude,
    } = req.body;

    if (!city || !name) {
      return res.status(400).json({ error: 'City and name are required.' });
    }

    const [result] = await db.query(
      `INSERT INTO neighborhoods
         (city, name, description,
          safety_score, schools_score, transport_score, walk_score,
          avg_price, price_per_sqm,
          latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        city.trim(), name.trim(), description?.trim() || null,
        safety_score    != null ? Number(safety_score)    : null,
        schools_score   != null ? Number(schools_score)   : null,
        transport_score != null ? Number(transport_score) : null,
        walk_score      != null ? Number(walk_score)      : null,
        avg_price       != null ? Number(avg_price)       : null,
        price_per_sqm   != null ? Number(price_per_sqm)   : null,
        latitude        != null ? Number(latitude)        : null,
        longitude       != null ? Number(longitude)       : null,
      ]
    );

    res.status(201).json({ id: result.insertId, city, name, message: 'Neighborhood created.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create neighborhood.' });
  }
}

// ── UPDATE ───────────────────────────────────────────────────────────────────
async function updateNeighborhood(req, res) {
  try {
    const {
      city, name, description,
      safety_score, schools_score, transport_score, walk_score,
      avg_price, price_per_sqm,
      latitude, longitude,
    } = req.body;

    if (!city || !name) {
      return res.status(400).json({ error: 'City and name are required.' });
    }

    const [result] = await db.query(
      `UPDATE neighborhoods
       SET city = ?, name = ?, description = ?,
           safety_score = ?, schools_score = ?, transport_score = ?, walk_score = ?,
           avg_price = ?, price_per_sqm = ?,
           latitude = ?, longitude = ?
       WHERE id = ?`,
      [
        city.trim(), name.trim(), description?.trim() || null,
        safety_score    != null ? Number(safety_score)    : null,
        schools_score   != null ? Number(schools_score)   : null,
        transport_score != null ? Number(transport_score) : null,
        walk_score      != null ? Number(walk_score)      : null,
        avg_price       != null ? Number(avg_price)       : null,
        price_per_sqm   != null ? Number(price_per_sqm)   : null,
        latitude        != null ? Number(latitude)        : null,
        longitude       != null ? Number(longitude)       : null,
        req.params.id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Neighborhood not found.' });
    }

    res.json({ message: 'Neighborhood updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update neighborhood.' });
  }
}

// ── DELETE ───────────────────────────────────────────────────────────────────
async function deleteNeighborhood(req, res) {
  try {
    const [result] = await db.query(
      'DELETE FROM neighborhoods WHERE id = ?',
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Neighborhood not found.' });
    }

    res.json({ message: 'Neighborhood deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete neighborhood.' });
  }
}

module.exports = { getAllNeighborhoods, createNeighborhood, updateNeighborhood, deleteNeighborhood };
