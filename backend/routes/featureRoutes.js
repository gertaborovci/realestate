const express = require('express');
const router = express.Router();

module.exports = (db) => {

    // 1. GET: Merr të gjitha veçoritë për një pronë specifike
    router.get('/:id/features', (req, res) => {
        const sql = "SELECT * FROM propertyfeatures WHERE property_id = ?";
        db.query(sql, [req.params.id], (err, results) => {
            if (err) return res.status(500).json({ error: "Gabim në databazë" });
            res.status(200).json(results);
        });
    });

    // 2. POST: Shto një veçori të re (psh. Ashensor: Po)
    router.post('/:id/features', (req, res) => {
        const { emertimi, vlera } = req.body;
        const property_id = req.params.id;

        const sql = "INSERT INTO propertyfeatures (property_id, emertimi, vlera) VALUES (?, ?, ?)";
        db.query(sql, [property_id, emertimi, vlera], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: "Veçoria u shtua me sukses!", id: result.insertId });
        });
    });

    // 3. PUT: Ndrysho një veçori ekzistuese
    router.put('/features/:feature_id', (req, res) => {
        const { emertimi, vlera } = req.body;
        const feature_id = req.params.feature_id;

        const sql = "UPDATE propertyfeatures SET emertimi = ?, vlera = ? WHERE id = ?";
        db.query(sql, [emertimi, vlera, feature_id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(200).json({ message: "Veçoria u përditësua!" });
        });
    });

    // 4. DELETE: Fshi një veçori
    router.delete('/features/:feature_id', (req, res) => {
        const feature_id = req.params.feature_id;

        const sql = "DELETE FROM propertyfeatures WHERE id = ?";
        db.query(sql, [feature_id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(200).json({ message: "Veçoria u fshi!" });
        });
    });

    return router;
};