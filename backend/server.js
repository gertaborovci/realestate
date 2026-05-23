const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer'); // SHTUAR: Për të menaxhuar file-t (fotot)
const path = require('path');     // SHTUAR: Për të lexuar rrugët e file-ve
const fs = require('fs');         // SHTUAR: Për të krijuar folderin automatikisht

const app = express();

app.use(cors()); 
app.use(express.json()); 

// SHTUAR: Kjo lejon që React të shohë fotot që ruhen në folderin "uploads"
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Krijon folderin "uploads" automatikisht nëse nuk ekziston (Mbron nga Error-et)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Konfigurimi i Multer: Ku do të ruhen fotot dhe me çfarë emri
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Ruhen në folderin uploads/
    },
    filename: function (req, file, cb) {
        // Shton datën aktuale për të mos lejuar që 2 foto me të njëjtin emër të fshijnë njëra-tjetrën
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});
const upload = multer({ storage: storage });

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      
    password: '',      
    database: 'findhome_db'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
        return;
    }
    console.log('✅ Successfully connected to the MySQL Database!');

    const fixDatabaseQuery = "ALTER TABLE properties ADD COLUMN type VARCHAR(50) DEFAULT 'BUY'";
    db.query(fixDatabaseQuery, (err) => {
        if (!err || err.errno === 1060) {
            console.log('✅ Properties table verified!');
        }
    });

    const createImagesTableQuery = `
        CREATE TABLE IF NOT EXISTS propertyimages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            property_id INT NOT NULL,
            image_url VARCHAR(255) NOT NULL,
            eshte_kryesore BOOLEAN DEFAULT false,
            renditja INT DEFAULT 0
        )
    `;
    db.query(createImagesTableQuery, (err) => {
        if (!err) console.log('✅ propertyimages table is ready!');
        else console.error('Error creating propertyimages table:', err);
    });
});

// ==========================================
// 1. API ROUTES PËR PRONAT (PROPERTIES CRUD)
// ==========================================

app.get('/api/properties', (req, res) => {
    const sqlQuery = "SELECT * FROM properties";
    db.query(sqlQuery, (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch." });
        res.status(200).json(results);
    });
});

app.get('/api/properties/:id', (req, res) => {
    const propertyId = req.params.id;
    const sqlQuery = "SELECT * FROM properties WHERE id = ?";
    db.query(sqlQuery, [propertyId], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to fetch property details." });
        if (result.length === 0) return res.status(404).json({ message: "Property not found." });
        res.status(200).json(result[0]);
    });
});

app.post('/api/properties', (req, res) => {
    const { title, price, location, status, type, image, rooms, bathrooms, area } = req.body;
    const sqlQuery = `INSERT INTO properties (title, price, location, status, type, image, rooms, bathrooms, area) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [title, price, location, status, type, image, rooms, bathrooms, area];

    db.query(sqlQuery, values, (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to save." });
        res.status(201).json({ id: result.insertId, ...req.body });
    });
});

app.delete('/api/properties/:id', (req, res) => {
    const propertyId = req.params.id;
    const sqlQuery = "DELETE FROM properties WHERE id = ?";
    db.query(sqlQuery, [propertyId], (err) => {
        if (err) return res.status(500).json({ error: "Failed to delete." });
        res.status(200).json({ message: "Deleted!" });
    });
});

app.put('/api/properties/:id', (req, res) => {
    const propertyId = req.params.id;
    const { title, price, location, status, type, image, rooms, bathrooms, area } = req.body;

    const sqlQuery = `UPDATE properties SET title = ?, price = ?, location = ?, status = ?, type = ?, image = ?, rooms = ?, bathrooms = ?, area = ? WHERE id = ?`;
    const values = [title, price, location, status, type, image, rooms, bathrooms, area, propertyId];

    db.query(sqlQuery, values, (err) => {
        if (err) return res.status(500).json({ error: "Failed to update." });
        res.status(200).json({ id: propertyId, ...req.body });
    });
});

// ==========================================
// 2. API ROUTES PËR IMAZHET (IMAGES CRUD ME MULTER)
// ==========================================
// SHTUAR: upload.single('image') e cila pranon file-in fizik nga React



app.get('/api/properties/:id/images', (req, res) => {
    const propertyId = req.params.id;
    const sqlQuery = "SELECT * FROM propertyimages WHERE property_id = ? ORDER BY renditja ASC";
    
    db.query(sqlQuery, [propertyId], (err, results) => {
        if (err) {
            console.error("Database error fetching images:", err);
            return res.status(500).json({ error: "Failed to fetch images." });
        }
        res.status(200).json(results);
    });
});








app.post('/api/properties/:id/images', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No image file provided." });
    }

    const propertyId = req.params.id;
    // URL-ja që do ruhet në DB (psh: /uploads/167890123.jpg)
    const imageUrl = `/uploads/${req.file.filename}`; 
    const eshteKryesore = req.body.eshte_kryesore === 'true' || req.body.eshte_kryesore === true ? 1 : 0;
    
    const sqlQuery = `INSERT INTO propertyimages (property_id, image_url, eshte_kryesore, renditja) VALUES (?, ?, ?, ?)`;
    db.query(sqlQuery, [propertyId, imageUrl, eshteKryesore, 0], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to add image to database." });
        res.status(201).json({ 
            message: "Image uploaded successfully!", 
            id: result.insertId,
            image_url: imageUrl 
        });
    });
});

app.delete('/api/properties/images/:image_id', (req, res) => {
    const imageId = req.params.image_id;
    const sqlQuery = "DELETE FROM propertyimages WHERE id = ?";
    
    db.query(sqlQuery, [imageId], (err) => {
        if (err) return res.status(500).json({ error: "Failed to delete image." });
        res.status(200).json({ message: "Image deleted!" });
    });
});

app.put('/api/properties/images/:image_id/set-main', (req, res) => {
    const imageId = req.params.image_id;
    const { property_id } = req.body;

    const resetQuery = "UPDATE propertyimages SET eshte_kryesore = false WHERE property_id = ?";
    db.query(resetQuery, [property_id], (err) => {
        if (err) return res.status(500).json({ error: "Error resetting images." });

        const setMainQuery = "UPDATE propertyimages SET eshte_kryesore = true WHERE id = ?";
        db.query(setMainQuery, [imageId], (err) => {
            if (err) return res.status(500).json({ error: "Failed to set main image." });
            res.status(200).json({ message: "Main image updated successfully!" });
        });
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server started on http://localhost:${PORT}`);
});