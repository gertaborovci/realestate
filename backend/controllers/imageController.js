const db = require('../db');

async function getByProperty(req, res) {
  const [results] = await db.query(
    'SELECT * FROM propertyimages WHERE property_id = ? ORDER BY renditja ASC',
    [req.params.id]
  );
  res.status(200).json(results);
}

async function upload(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No image file provided.' });

  const imageUrl = `/uploads/${req.file.filename}`;
  const eshteKryesore = req.body.eshte_kryesore === 'true' || req.body.eshte_kryesore === true ? 1 : 0;
  const renditja = Number(req.body.renditja) || 0;

  const [result] = await db.query(
    'INSERT INTO propertyimages (property_id, image_url, eshte_kryesore, renditja) VALUES (?, ?, ?, ?)',
    [req.params.id, imageUrl, eshteKryesore, renditja]
  );

  res.status(201).json({
    message: 'Image uploaded successfully!',
    id: result.insertId,
    image_url: imageUrl,
  });
}

async function remove(req, res) {
  await db.query('DELETE FROM propertyimages WHERE id = ?', [req.params.image_id]);
  res.status(200).json({ message: 'Image deleted!' });
}

async function setMain(req, res) {
  const { property_id } = req.body;
  await db.query('UPDATE propertyimages SET eshte_kryesore = false WHERE property_id = ?', [property_id]);
  await db.query('UPDATE propertyimages SET eshte_kryesore = true WHERE id = ?', [req.params.image_id]);
  res.status(200).json({ message: 'Main image updated successfully!' });
}

module.exports = { getByProperty, upload, remove, setMain };
