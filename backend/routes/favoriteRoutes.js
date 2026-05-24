const express = require('express');
const router = express.Router();
const db = require('../db');

// Merr listën e të preferuarave për një klient specifik
router.get('/:client_id', (req, res) => {
    db.query('SELECT * FROM Favorites WHERE client_id = ?', [req.params.client_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Shto një pronë te të preferuarat
router.post('/', (req, res) => {
    const { client_id, property_id } = req.body;
    db.query("INSERT INTO Favorites (client_id, property_id) VALUES (?, ?)", [client_id, property_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Prona u shtua te të preferuarat!" });
    });
});

// Hiq një pronë nga të preferuarat
router.delete('/:id', (req, res) => {
    db.query("DELETE FROM Favorites WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Prona u hoq nga të preferuarat!" });
    });
});

module.exports = router;