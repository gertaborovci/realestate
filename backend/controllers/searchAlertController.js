const db = require('../db');

// ── READ all for a specific user ─────────────────────────────────────────────
async function getByUser(req, res) {
  const [rows] = await db.query(
    'SELECT * FROM searchalerts WHERE client_id = ? ORDER BY data_krijimit DESC',
    [req.params.user_id]
  );
  res.json(rows);
}

// ── READ all (admin) ─────────────────────────────────────────────────────────
async function getAll(req, res) {
  const [rows] = await db.query('SELECT * FROM searchalerts ORDER BY data_krijimit DESC');
  res.json(rows);
}

// ── CREATE ───────────────────────────────────────────────────────────────────
async function create(req, res) {
  const { user_id, qyteti, cmimi_max, dhomat, lloji_prones, required_features } = req.body;

  if (!user_id) return res.status(400).json({ error: 'user_id is required.' });

  const [result] = await db.query(
    'INSERT INTO searchalerts (client_id, qyteti, cmimi_max, dhomat, lloji_prones, required_features) VALUES (?, ?, ?, ?, ?, ?)',
    [user_id, qyteti || null, cmimi_max || null, dhomat || null, lloji_prones || null, required_features || null]
  );
  res.status(201).json({ id: result.insertId, message: 'Search alert saved.' });
}

// ── UPDATE ───────────────────────────────────────────────────────────────────
async function update(req, res) {
  const { qyteti, cmimi_max, dhomat, lloji_prones, required_features } = req.body;

  const [result] = await db.query(
    `UPDATE searchalerts
     SET qyteti = ?, cmimi_max = ?, dhomat = ?, lloji_prones = ?, required_features = ?
     WHERE id = ?`,
    [qyteti || null, cmimi_max || null, dhomat || null, lloji_prones || null, required_features || null, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Alert not found.' });
  res.json({ message: 'Alert updated.' });
}

// ── DELETE ───────────────────────────────────────────────────────────────────
async function remove(req, res) {
  const [result] = await db.query('DELETE FROM searchalerts WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Alert not found.' });
  res.json({ message: 'Alert deleted.' });
}

/**
 * Called after a property is created.
 * Finds all matching search alerts and fires a notification to each owner.
 */
// ── Levenshtein distance (mirrors the frontend fuzzy helper) ─────────────────
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

// Loose city match: handles "Prishtine" vs "Pristina", "Prishtina", etc.
function cityMatches(location, alertCity) {
  if (!alertCity) return true; // no city filter = match all
  const loc  = (location || '').toLowerCase();
  const city = alertCity.toLowerCase().trim();
  if (loc.includes(city) || city.includes(loc)) return true;
  // Check each comma-separated token of the location
  const parts = loc.split(/[,\s]+/).filter(Boolean);
  return parts.some(p => levenshtein(p, city) <= 2);
}

async function notifyMatchingAlerts({ propertyId, title, location, price, rooms, type }) {
  const { createNotification } = require('../utils/notify');
  try {
    // Fetch ALL alerts — do city matching in JS with fuzzy logic
    const [alerts] = await db.query('SELECT * FROM searchalerts');

    // Pre-fetch property features if needed
    let propertyFeatures = null;
    const getPropertyFeatures = async () => {
      if (propertyFeatures === null && propertyId) {
        const [rows] = await db.query(
          'SELECT emertimi FROM propertyfeatures WHERE property_id = ?', [propertyId]
        );
        propertyFeatures = new Set(rows.map(r => r.emertimi.toLowerCase()));
      }
      return propertyFeatures || new Set();
    };

    for (const alert of alerts) {
      // ── City: fuzzy JS match ──────────────────────────────────────────────
      if (alert.qyteti && !cityMatches(location, alert.qyteti)) continue;

      // ── Price: numeric ────────────────────────────────────────────────────
      if (alert.cmimi_max != null && Number(price) > Number(alert.cmimi_max)) continue;

      // ── Rooms: numeric ────────────────────────────────────────────────────
      if (alert.dhomat != null && Number(rooms) < Number(alert.dhomat)) continue;

      // ── Type: normalise both sides before comparing ────────────────────────
      if (alert.lloji_prones) {
        const aType = alert.lloji_prones.toLowerCase();
        const pType = (type || '').toLowerCase();
        // Accept both Albanian and English variants
        const isRentAlert = aType === 'qira' || aType === 'rent';
        const isRentProp  = pType === 'qira' || pType === 'rent';
        const isSaleAlert = aType === 'shitje' || aType === 'sale' || aType === 'buy';
        const isSaleProp  = pType === 'shitje' || pType === 'sale' || pType === 'buy';
        if (isRentAlert && !isRentProp) continue;
        if (isSaleAlert && !isSaleProp) continue;
      }

      // ── Required features ─────────────────────────────────────────────────
      if (alert.required_features) {
        const required = alert.required_features.split(',').map(f => f.trim().toLowerCase()).filter(Boolean);
        if (required.length > 0) {
          const has = await getPropertyFeatures();
          if (!required.every(f => has.has(f))) continue;
        }
      }

      // ── All checks passed → notify ────────────────────────────────────────
      await createNotification({
        user_id: alert.client_id,
        type:    'alert',
        title:   '🏠 New Property Match!',
        message: `"${title}" in ${location} matches your search alert.`,
        link:    'properties',
      });
    }
  } catch (e) {
    console.error('[search-alerts] notification error:', e.message);
  }
}

module.exports = { getAll, getByUser, create, update, remove, notifyMatchingAlerts };
