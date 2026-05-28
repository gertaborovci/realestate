const express = require('express');
const router = express.Router();
const db = require('../db');

// Route për të marrë të gjitha vlerësimet
router.get('/', (req, res) => {
    db.query('SELECT * FROM Reviews', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Route për të shtuar një vlerësim të ri
router.post('/', (req, res) => {
    const { agent_id, client_id, vleresimi, komenti } = req.body;
    const sql = "INSERT INTO Reviews (agent_id, client_id, vleresimi, komenti) VALUES (?, ?, ?, ?)";
    
    db.query(sql, [agent_id, client_id, vleresimi, komenti], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Vlerësimi u shtua me sukses!", id: result.insertId });
    });
});

module.exports = router;