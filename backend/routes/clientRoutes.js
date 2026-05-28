const express = require('express');
const router = express.Router();
const db = require('../db');

// Merr të gjithë klientët
router.get('/', (req, res) => {
    db.query('SELECT * FROM Clients', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Shto një klient të ri
router.post('/', (req, res) => {
    const { user_id, emri, mbiemri, telefoni, email, buxheti_max, preferencat, lloji_klientit } = req.body;
    const sql = "INSERT INTO Clients (user_id, emri, mbiemri, telefoni, email, buxheti_max, preferencat, lloji_klientit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [user_id, emri, mbiemri, telefoni, email, buxheti_max, preferencat, lloji_klientit], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Klienti u shtua!", id: result.insertId });
    });
});

// Ndrysho të gjitha detajet e klientit (PUT) - VERSIONI I PLOTË
router.put('/:id', (req, res) => {
    const { emri, mbiemri, telefoni, email, buxheti_max, preferencat, lloji_klientit } = req.body;
    
    const sql = `
        UPDATE Clients 
        SET emri = ?, mbiemri = ?, telefoni = ?, email = ?, buxheti_max = ?, preferencat = ?, lloji_klientit = ?
        WHERE id = ?
    `;
    
    db.query(sql, [emri, mbiemri, telefoni, email, buxheti_max, preferencat, lloji_klientit, req.params.id], (err, result) => {
        if (err) {
            console.error("Gabim në databazë:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Detajet e klientit u përditësuan me sukses!" });
    });
});

// Fshi një klient
router.delete('/:id', (req, res) => {
    db.query("DELETE FROM Clients WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Klienti u fshi!" });
    });
});

module.exports = router;