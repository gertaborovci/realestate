const express = require('express');
const router = express.Router();

const db = require('./db'); 

router.post('/favorites', async (req, res) => {
    const { client_id, property_id } = req.body;
    try {
        const query = "INSERT IGNORE INTO favorites (client_id, property_id) VALUES (?, ?)";
        await db.query(query, [client_id, property_id]);
        res.status(200).json({ success: true, message: "U shtua në favorites!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/favorites', async (req, res) => {
    const { client_id, property_id } = req.body;
    try {
        const query = "DELETE FROM favorites WHERE client_id = ? AND property_id = ?";
        await db.query(query, [client_id, property_id]);
        res.status(200).json({ success: true, message: "U hoq nga favorites!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/favorites/:clientId', async (req, res) => {
    const clientId = req.params.clientId;
    try {
        const query = `
            SELECT p.* FROM properties p 
            INNER JOIN favorites f ON p.id = f.property_id 
            WHERE f.client_id = ?
        `;
        const [rows] = await db.query(query, [clientId]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/profile/:clientId', async (req, res) => {
    const clientId = req.params.clientId;
    const { phone, address } = req.body;
    try {
        const query = "UPDATE clients SET phone = ?, address = ? WHERE id = ?";
        await db.query(query, [phone, address, clientId]);
        res.status(200).json({ success: true, message: "Profili u përditësua!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;