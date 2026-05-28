const express = require('express');
<<<<<<< HEAD
const { asyncHandler } = require('../middleware/errorHandler');
const agentController = require('../controllers/agentController');

const router = express.Router();

router.get('/', asyncHandler(agentController.getAll));
router.get('/:id', asyncHandler(agentController.getById));
router.post('/', asyncHandler(agentController.create));
router.put('/:id', asyncHandler(agentController.update));
router.delete('/:id', asyncHandler(agentController.remove));

module.exports = router;
=======
const router = express.Router();
const db = require('../db');

// Merr të gjithë agjentët
router.get('/', (req, res) => {
    db.query('SELECT * FROM Agents', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Shto agjent të ri
router.post('/', (req, res) => {
    const { user_id, username, license_number, specialization, commission_percentage, zone, status } = req.body;
    const sql = "INSERT INTO Agents (user_id, username, license_number, specialization, commission_percentage, zone, status) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [user_id, username, license_number, specialization, commission_percentage, zone, status], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Agjenti u shtua!", id: result.insertId });
    });
});

// Përditëso agjentin
router.put('/:id', (req, res) => {
    const { license_number, specialization, commission_percentage, zone, status } = req.body;
    const sql = "UPDATE Agents SET license_number = ?, specialization = ?, commission_percentage = ?, zone = ?, status = ? WHERE id = ?";
    db.query(sql, [license_number, specialization, commission_percentage, zone, status, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Agjenti u përditësua!" });
    });
});

// Fshi agjentin
router.delete('/:id', (req, res) => {
    db.query("DELETE FROM Agents WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Agjenti u fshi!" });
    });
});

module.exports = router;
>>>>>>> 3c9ebc6bc7082101a6d08ac308d830ba61476dbc
