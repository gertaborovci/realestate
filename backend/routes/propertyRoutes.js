const express = require('express');
const router = express.Router();
const db = require('../db'); // Importon lidhjen me databazën

// Kjo rrugë do të jetë /api/properties (sepse e regjistrojmë në server.js)
router.get('/', (req, res) => {
    const sql = "SELECT * FROM properties"; // Sigurohu që emri i tabelës në databazë është 'properties'
    db.query(sql, (err, data) => {
        if (err) {
            console.error("Gabim në databazë:", err);
            return res.status(500).json({ error: "Gabim në server" });
        }
        return res.json(data); // Kthen të dhënat si JSON
    });
});

module.exports = router;