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
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'findhome_db'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Lidhja me databazën dështoi:', err.message);
        return;
    }
    console.log('✅ Successfully connected to the MySQL Database!');

    // Pjesa nga 'main' për të siguruar kolonën 'type'
    const fixDatabaseQuery = "ALTER TABLE properties ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'BUY'";
    db.query(fixDatabaseQuery, (err) => {
        if (!err) console.log('✅ Properties table verified!');
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


// IMPORTIMI I ROUTE-VE TË REJA
const featureRoutes = require('./routes/featureRoutes.js')(db);
app.use('/api/properties', featureRoutes);



app.get('/api/properties', (req, res) => {
    db.query("SELECT * FROM properties", (err, results) => {
        if (err) {
            console.error("❌ SQL Error (GET):", err.message);
            return res.status(500).json({ error: err.message });
        }
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
    const sql = "INSERT INTO properties (title, price, location, status, type, image, rooms, bathrooms, area) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [title, price, location, status, type, image, rooms, bathrooms, area], (err, result) => {
        if (err) {
            console.error("❌ SQL Error (POST):", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: result.insertId, ...req.body });
    });
});

app.put('/api/properties/:id', (req, res) => {
    const { title, price, location, status, type, image, rooms, bathrooms, area } = req.body;
    const sql = "UPDATE properties SET title = ?, price = ?, location = ?, status = ?, type = ?, image = ?, rooms = ?, bathrooms = ?, area = ? WHERE id = ?";
    db.query(sql, [title, price, location, status, type, image, rooms, bathrooms, area, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "U përditësua me sukses!" });
    });
});

app.delete('/api/properties/:id', (req, res) => {
    db.query("DELETE FROM properties WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "U fshi me sukses!" });
    });
});


// ==========================================
// 2. API ROUTES PËR IMAZHET (IMAGES CRUD ME MULTER)
// ==========================================

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


// ==========================================
// 3. API ROUTES: CLIENTS, FAVORITES, REVIEWS (Nga GitHub)
// ==========================================

app.get('/api/clients', (req, res) => {
    db.query("SELECT * FROM clients", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/clients', (req, res) => {
    const { user_id, emri, mbiemri, telefoni, email, buxheti_max, preferencat, lloji_klientit } = req.body;
    const sql = "INSERT INTO clients (user_id, emri, mbiemri, telefoni, email, buxheti_max, preferencat, lloji_klientit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [user_id, emri, mbiemri, telefoni, email, buxheti_max, preferencat, lloji_klientit], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Client created successfully!" });
    });
});

app.post('/api/favorites', (req, res) => {
    const { client_id, property_id } = req.body;
    db.query("INSERT INTO favorites (client_id, property_id) VALUES (?, ?)", [client_id, property_id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Favorite added!" });
    });
});

app.get('/api/reviews/:agent_id', (req, res) => {
    db.query("SELECT * FROM reviews WHERE agent_id = ?", [req.params.agent_id], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/reviews', (req, res) => {
    const { agent_id, client_id, vleresimi, komenti } = req.body;
    db.query("INSERT INTO reviews (agent_id, client_id, vleresimi, komenti) VALUES (?, ?, ?, ?)", [agent_id, client_id, vleresimi, komenti], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Review added successfully!" });
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server started on http://localhost:${PORT}`);
});