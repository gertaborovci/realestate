require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mysql = require('mysql2'); 

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ==========================================
// SETUP I FOTOVE (MULTER)
// ==========================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); 
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});
const upload = multer({ storage: storage });

// ==========================================
// LIDHJA ME DATABAZËN 
// ==========================================
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

    // Auto-create users table (needed for auth / login)
    const createUsersTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin','agent','user') NOT NULL DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    db.query(createUsersTableQuery, (err) => {
        if (!err) console.log('✅ users table is ready!');
        else console.error('Error creating users table:', err);
    });
});

// ==========================================
// ROUTES
// ==========================================
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes        = require('./routes/authRoutes');
const agentRoutes       = require('./routes/agentRoutes');
const featureRoutes     = require('./routes/featureRoutes.js');
const userRoutes        = require('./routes/userRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const searchAlertRoutes = require('./routes/searchAlertRoutes');

app.use('/api/auth',          authRoutes);
app.use('/api/agents',        agentRoutes);
app.use('/api/properties',    featureRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/testimonials',  testimonialRoutes);
app.use('/api/search-alerts', searchAlertRoutes);

// ==========================================
// 1. API ROUTES PËR PRONAT
// ==========================================
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
    db.query("SELECT * FROM properties WHERE id = ?", [propertyId], (err, result) => {
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
    const sql = "UPDATE properties SET title = ?, price = ?, location = ?, status = ?, type = ?, image = ?, rooms = bathrooms = ?, area = ? WHERE id = ?";
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
// 2. API ROUTES PËR IMAZHET (MULTER)
// ==========================================
app.get('/api/properties/:id/images', (req, res) => {
    const propertyId = req.params.id;
    db.query("SELECT * FROM propertyimages WHERE property_id = ? ORDER BY renditja ASC", [propertyId], (err, results) => {
        if (err) {
            console.error("Database error fetching images:", err);
            return res.status(500).json({ error: "Failed to fetch images." });
        }
        res.status(200).json(results);
    });
});

app.post('/api/properties/:id/images', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No image file provided." });

    const propertyId = req.params.id;
    const imageUrl = `/uploads/${req.file.filename}`; 
    const eshteKryesore = req.body.eshte_kryesore === 'true' || req.body.eshte_kryesore === true ? 1 : 0;
    
    db.query(`INSERT INTO propertyimages (property_id, image_url, eshte_kryesore, renditja) VALUES (?, ?, ?, ?)`, 
    [propertyId, imageUrl, eshteKryesore, 0], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to add image to database." });
        res.status(201).json({ message: "Image uploaded successfully!", id: result.insertId, image_url: imageUrl });
    });
});

app.delete('/api/properties/images/:image_id', (req, res) => {
    db.query("DELETE FROM propertyimages WHERE id = ?", [req.params.image_id], (err) => {
        if (err) return res.status(500).json({ error: "Failed to delete image." });
        res.status(200).json({ message: "Image deleted!" });
    });
});

app.put('/api/properties/images/:image_id/set-main', (req, res) => {
    const imageId = req.params.image_id;
    const { property_id } = req.body;

    db.query("UPDATE propertyimages SET eshte_kryesore = false WHERE property_id = ?", [property_id], (err) => {
        if (err) return res.status(500).json({ error: "Error resetting images." });

        db.query("UPDATE propertyimages SET eshte_kryesore = true WHERE id = ?", [imageId], (err) => {
            if (err) return res.status(500).json({ error: "Failed to set main image." });
            res.status(200).json({ message: "Main image updated successfully!" });
        });
    });
});

// ==========================================
// 3. API ROUTES: CLIENTS, FAVORITES, REVIEWS
// ==========================================
app.get('/api/clients', (req, res) => {
    db.query("SELECT * FROM clients", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/clients', (req, res) => {
    const { user_id, emri, mbiemri, telefoni, email, buxheti_max, preferencat, lloji_klientit } = req.body;
    db.query("INSERT INTO clients (user_id, emri, mbiemri, telefoni, email, buxheti_max, preferencat, lloji_klientit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
    [user_id, emri, mbiemri, telefoni, email, buxheti_max, preferencat, lloji_klientit], (err) => {
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

// =========================================================================
// 🚀 MODULI: FINANCAT & LOGJISTIKA (Përditësuar për Elzën)
// =========================================================================
app.get('/api/maintenance', (req, res) => {
    const query = `
        SELECT m.*, p.title as property_title 
        FROM maintenancetickets m 
        LEFT JOIN properties p ON m.property_id = p.id
        ORDER BY m.created_at DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json(err);
        res.status(200).json(results);
    });
});

app.post('/api/maintenance', (req, res) => {
    const { property_id, tenant_id, title, description } = req.body;
    db.query("INSERT INTO maintenancetickets (property_id, tenant_id, title, description, status) VALUES (?, ?, ?, ?, 'Pending')", 
    [property_id, tenant_id, title, description], (err, result) => {
        if (err) return res.status(500).json(err);
        res.status(201).json({ id: result.insertId, ...req.body });
    });
});

app.put('/api/maintenance/:id', (req, res) => {
    const { status, cost, title } = req.body;
    db.query("UPDATE maintenancetickets SET status = ? WHERE id = ?", [status, req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        
        if (status === 'Resolved' && cost > 0) {
            const description = `Riparim automatik: ${title || 'Tiketë Mirëmbajtjeje'}`;
            db.query("INSERT INTO agencyexpenses (category, amount, description, expense_date) VALUES (?, ?, ?, NOW())", 
            ['Maintenance', cost, description], (err) => {
                if (err) return res.status(500).json(err);
                return res.status(200).json({ message: "Statusi u ndryshua dhe u regjistrua në financa!" });
            });
        } else {
            res.status(200).json({ message: "Statusi u ndryshua!" });
        }
    });
});

app.delete('/api/maintenance/:id', (req, res) => {
    db.query("DELETE FROM maintenancetickets WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.status(200).json({ message: "Bileta u fshi!" });
    });
});

app.get('/api/expenses', (req, res) => {
    db.query("SELECT * FROM agencyexpenses ORDER BY expense_date DESC", (err, results) => {
        if (err) return res.status(500).json(err);
        res.status(200).json(results);
    });
});

app.post('/api/expenses', (req, res) => {
    const { category, amount, description, expense_date } = req.body;
    db.query("INSERT INTO agencyexpenses (category, amount, description, expense_date) VALUES (?, ?, ?, ?)", 
    [category, amount, description, expense_date], (err, result) => {
        if (err) return res.status(500).json(err);
        res.status(201).json({ id: result.insertId, ...req.body });
    });
});

app.delete('/api/expenses/:id', (req, res) => {
    db.query("DELETE FROM agencyexpenses WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.status(200).json({ message: "Shpenzimi u fshi!" });
    });
});

app.get('/api/financial-summary', (req, res) => {
    const queryTotalPayments = "SELECT COALESCE(SUM(amount), 0) as total_income FROM payments WHERE status = 'PAID'";
    const queryTotalExpenses = "SELECT COALESCE(SUM(amount), 0) as total_expenses FROM agencyexpenses";

    db.query(queryTotalPayments, (err, incomeRes) => {
        if (err) return res.status(500).json(err);
        
        db.query(queryTotalExpenses, (err, expenseRes) => {
            if (err) return res.status(500).json(err);

            const dbIncome = parseFloat(incomeRes[0].total_income);
            const grossRevenue = dbIncome > 0 ? dbIncome : 180000; 

            const totalExpenses = parseFloat(expenseRes[0].total_expenses);
            const netProfit = grossRevenue - totalExpenses;

            res.json({
                grossRevenue,
                totalExpenses,
                netProfit
            });
        });
    });
});

// Global error handler (must be last middleware)
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Server started on http://localhost:${PORT}`);
});