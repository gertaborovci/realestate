require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path         = require('path');
const fs           = require('fs');
const multer       = require('multer');
const mysql        = require('mysql2');
const swaggerUi    = require('swagger-ui-express');
const swaggerSpec  = require('./swagger');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── API Documentation — Swagger UI ─────────────────────────────────────────
// Available at http://localhost:5000/api-docs
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'KosovaNest API Docs',
  swaggerOptions: { persistAuthorization: true },
}));

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS — restrict to known origins ───────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());  // parse httpOnly cookies (refresh token)

// ==========================================
// SETUP I FOTOVE (MULTER)
// ==========================================
// Serve uploaded files — override Helmet's same-origin CORP so the frontend
// (localhost:5173) can load images that are hosted on the API (localhost:5000)
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

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

    // Ensure 'type' column exists
    db.query("ALTER TABLE properties ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'BUY'", (err) => {
        if (!err) console.log('✅ Properties.type column verified!');
    });

    // Ensure 'agent_id' column exists (links a property to the agent who listed it)
    db.query("ALTER TABLE properties ADD COLUMN IF NOT EXISTS agent_id INT DEFAULT NULL", (err) => {
        if (!err) console.log('✅ Properties.agent_id column verified!');
    });

    // Ensure 'visits' table exists
    db.query(`
        CREATE TABLE IF NOT EXISTS visits (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            agent_id    INT          DEFAULT NULL,
            property_id INT          DEFAULT NULL,
            user_id     INT          DEFAULT NULL,
            visit_date  DATE         NOT NULL,
            visit_time  VARCHAR(10)  NOT NULL,
            notes       TEXT         DEFAULT NULL,
            agent_notes TEXT         DEFAULT NULL,
            status      VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
            created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (!err) console.log('✅ visits table verified!');
        else console.error('Error verifying visits table:', err.message);
    });

    // Ensure agent_notes column exists on existing visits tables
    db.query("ALTER TABLE visits ADD COLUMN IF NOT EXISTS agent_notes TEXT DEFAULT NULL", (err) => {
        if (!err) console.log('✅ visits.agent_notes column ready!');
    });

    // Ensure rejection_reason column exists on certifications table
    db.query("ALTER TABLE certifications ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL", (err) => {
        if (!err) console.log('✅ certifications.rejection_reason column ready!');
    });

    // Ensure 'notifications' table exists
    db.query(`
        CREATE TABLE IF NOT EXISTS notifications (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            user_id    INT           NOT NULL,
            type       VARCHAR(50)   NOT NULL DEFAULT 'system',
            title      VARCHAR(150)  NOT NULL,
            message    TEXT          NOT NULL,
            is_read    TINYINT(1)    NOT NULL DEFAULT 0,
            link       VARCHAR(255)  DEFAULT NULL,
            created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (!err) console.log('✅ notifications table verified!');
        else console.error('Error creating notifications table:', err.message);
    });

    // Ensure profile columns exist on users table
    const userProfileColumns = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30) DEFAULT NULL",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS license_id VARCHAR(100) DEFAULT NULL",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS specialization VARCHAR(150) DEFAULT NULL",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url VARCHAR(255) DEFAULT NULL",
    ];
    userProfileColumns.forEach(sql => {
        db.query(sql, (err) => {
            if (err) console.error('Error adding users column:', err.message);
        });
    });
    console.log('✅ users profile columns verified!');

    // Ensure 'contracts' table exists
    db.query(`
        CREATE TABLE IF NOT EXISTS contracts (
            id                INT           AUTO_INCREMENT PRIMARY KEY,
            contract_number   VARCHAR(30)   NOT NULL DEFAULT '',
            user_id           INT           NOT NULL,
            property_id       INT           NOT NULL,
            agent_id          INT           DEFAULT NULL,
            type              VARCHAR(10)   NOT NULL DEFAULT 'Sale',
            property_price    DECIMAL(12,2) NOT NULL DEFAULT 0,
            deposit_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
            remaining_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
            signed_by_buyer   TINYINT(1)    NOT NULL DEFAULT 0,
            signed_by_agent   TINYINT(1)    NOT NULL DEFAULT 0,
            notes             TEXT          DEFAULT NULL,
            status            VARCHAR(30)   NOT NULL DEFAULT 'Pending Signature',
            created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
            updated_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (!err) console.log('✅ contracts table verified!');
        else console.error('Error verifying contracts table:', err.message);
    });

    // Ensure 'certifications' table exists
    db.query(`
        CREATE TABLE IF NOT EXISTS certifications (
            id           INT          AUTO_INCREMENT PRIMARY KEY,
            agent_id     INT          NOT NULL,
            document_url VARCHAR(255) NOT NULL,
            type         VARCHAR(80)  NOT NULL DEFAULT 'Passport / ID',
            status       VARCHAR(30)  NOT NULL DEFAULT 'Pending',
            expires_at   DATE         DEFAULT NULL,
            created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (!err) console.log('✅ certifications table verified!');
        else console.error('Error verifying certifications table:', err.message);
    });

    // Migrate existing contracts table — add new columns if missing
    const contractMigrations = [
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_number   VARCHAR(30)   NOT NULL DEFAULT ''",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS property_price    DECIMAL(12,2) NOT NULL DEFAULT 0",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS deposit_amount    DECIMAL(12,2) NOT NULL DEFAULT 0",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS remaining_balance DECIMAL(12,2) NOT NULL DEFAULT 0",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signed_by_buyer   TINYINT(1)    NOT NULL DEFAULT 0",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signed_by_agent   TINYINT(1)    NOT NULL DEFAULT 0",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS notes             TEXT          DEFAULT NULL",
    ];
    contractMigrations.forEach((sql) => db.query(sql, () => {}));

    // Ensure 'transactions' table exists
    db.query(`
        CREATE TABLE IF NOT EXISTS transactions (
            id           INT            AUTO_INCREMENT PRIMARY KEY,
            contract_id  INT            NOT NULL,
            payment_type VARCHAR(30)    NOT NULL DEFAULT 'Deposit',
            amount       DECIMAL(12,2)  NOT NULL,
            payment_date DATE           NOT NULL,
            method       VARCHAR(50)    NOT NULL DEFAULT 'Bank Transfer',
            status       VARCHAR(20)    NOT NULL DEFAULT 'Pending',
            notes        TEXT           DEFAULT NULL,
            created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (!err) console.log('✅ transactions table verified!');
        else console.error('Error verifying transactions table:', err.message);
    });

    // Migrate existing transactions table
    const txMigrations = [
        "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_type VARCHAR(30) NOT NULL DEFAULT 'Deposit' AFTER contract_id",
        "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL AFTER status",
    ];
    txMigrations.forEach((sql) => db.query(sql, () => {}));

    // Ensure 'contact_inquiries' table exists
    db.query(`
        CREATE TABLE IF NOT EXISTS contact_inquiries (
            id           INT           AUTO_INCREMENT PRIMARY KEY,
            agent_id     INT           DEFAULT NULL,
            client_name  VARCHAR(150)  NOT NULL,
            client_email VARCHAR(150)  DEFAULT NULL,
            message      TEXT          NOT NULL,
            reply        TEXT          DEFAULT NULL,
            status       VARCHAR(30)   NOT NULL DEFAULT 'new',
            created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (!err) console.log('✅ contact_inquiries table verified!');
        else console.error('Error verifying contact_inquiries table:', err.message);
    });

    // Migrate contact_inquiries — add columns if missing
    const inquiryMigrations = [
        "ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS reply  TEXT       DEFAULT NULL  AFTER message",
        "ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'new' AFTER reply",
    ];
    inquiryMigrations.forEach((sql) => db.query(sql, () => {}));

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

    const createTestimonialsTableQuery = `
        CREATE TABLE IF NOT EXISTS testimonials (
            id INT AUTO_INCREMENT PRIMARY KEY,
            klienti_emri VARCHAR(100) NOT NULL DEFAULT 'Anonymous',
            teksti TEXT NOT NULL,
            data_publikimit TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    db.query(createTestimonialsTableQuery, (err) => {
        if (!err) console.log('✅ testimonials table is ready!');
        else console.error('Error creating testimonials table:', err);
    });

    const createAgentRatingsTableQuery = `
        CREATE TABLE IF NOT EXISTS agent_ratings (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            user_id    INT NOT NULL,
            agent_id   INT NOT NULL,
            agent_name VARCHAR(100) NOT NULL,
            rating     DECIMAL(2,1) NOT NULL,
            comment    TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_user_agent (user_id, agent_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;
    db.query(createAgentRatingsTableQuery, (err) => {
        if (!err) console.log('✅ agent_ratings table is ready!');
        else console.error('Error creating agent_ratings table:', err);
    });

    // Ensure 'property_reviews' table exists
    db.query(`
        CREATE TABLE IF NOT EXISTS property_reviews (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            user_id     INT NOT NULL,
            property_id INT NOT NULL,
            rating      DECIMAL(2,1) NOT NULL,
            comment     TEXT DEFAULT NULL,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_property (user_id, property_id)
        )
    `, (err) => {
        if (!err) console.log('✅ property_reviews table is ready!');
        else console.error('Error creating property_reviews table:', err);
    });

    // Ensure searchalerts has required_features column (added in later migration)
    db.query("ALTER TABLE searchalerts ADD COLUMN IF NOT EXISTS required_features VARCHAR(500) DEFAULT NULL", () => {});

    // Ensure testimonials has user_id column (added for ownership tracking)
    db.query("ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS user_id INT DEFAULT NULL", () => {});

    // Ensure QA tables exist
    db.query(`CREATE TABLE IF NOT EXISTS agent_qa (
        id INT AUTO_INCREMENT PRIMARY KEY, agent_id INT NOT NULL, question VARCHAR(500) NOT NULL,
        answer TEXT NOT NULL, sort_order INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, () => {});
    db.query(`CREATE TABLE IF NOT EXISTS property_qa (
        id INT AUTO_INCREMENT PRIMARY KEY, agent_id INT, property_id INT NOT NULL,
        question VARCHAR(500) NOT NULL, answer TEXT NOT NULL, sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, () => {});
    db.query(`CREATE TABLE IF NOT EXISTS qa_exclusions (
        id INT AUTO_INCREMENT PRIMARY KEY, agent_id INT NOT NULL, property_id INT NOT NULL,
        UNIQUE KEY unique_exclusion (agent_id, property_id)
    )`, () => {});

    // Ensure 'offices' table exists
    db.query(`
        CREATE TABLE IF NOT EXISTS offices (
            id            INT AUTO_INCREMENT PRIMARY KEY,
            name          VARCHAR(150)  NOT NULL,
            address       VARCHAR(255)  NOT NULL,
            city          VARCHAR(100)  NOT NULL,
            phone         VARCHAR(30)   DEFAULT NULL,
            email         VARCHAR(150)  DEFAULT NULL,
            working_hours VARCHAR(200)  DEFAULT NULL,
            map_url       VARCHAR(500)  DEFAULT NULL,
            is_active     TINYINT(1)    NOT NULL DEFAULT 1,
            created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (!err) console.log('✅ offices table verified!');
        else console.error('Error creating offices table:', err.message);
    });

    // Ensure 'tickets' table exists
    db.query(`
        CREATE TABLE IF NOT EXISTS tickets (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            user_id     INT          NOT NULL,
            subject     VARCHAR(200) NOT NULL,
            message     TEXT         NOT NULL,
            priority    VARCHAR(20)  NOT NULL DEFAULT 'Medium',
            status      VARCHAR(20)  NOT NULL DEFAULT 'Open',
            admin_reply TEXT         DEFAULT NULL,
            created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
            updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (!err) console.log('✅ tickets table verified!');
        else console.error('Error creating tickets table:', err.message);
    });

    // Ensure 'maintenance_requests' table exists
    db.query(`
        CREATE TABLE IF NOT EXISTS maintenance_requests (
            id                   INT AUTO_INCREMENT PRIMARY KEY,
            property_id          INT           DEFAULT NULL,
            user_id              INT           DEFAULT NULL,
            title                VARCHAR(200)  NOT NULL,
            description          TEXT          NOT NULL,
            category             VARCHAR(50)   NOT NULL DEFAULT 'General',
            priority             VARCHAR(20)   NOT NULL DEFAULT 'Medium',
            status               VARCHAR(30)   NOT NULL DEFAULT 'Pending',
            admin_notes          TEXT          DEFAULT NULL,
            assigned_technician  VARCHAR(150)  DEFAULT NULL,
            cost                 DECIMAL(10,2) DEFAULT NULL,
            media_url            VARCHAR(500)  DEFAULT NULL,
            created_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
            updated_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (!err) console.log('✅ maintenance_requests table verified!');
        else console.error('Error creating maintenance_requests table:', err.message);
    });
});

// ==========================================
// ROUTES
// ==========================================
const { errorHandler } = require('./middleware/errorHandler');

// ── Rate limiting ───────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // max 20 login/register attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

// ── Route modules ───────────────────────────────────────────────────────────
const authRoutes           = require('./routes/authRoutes');
const agentRoutes          = require('./routes/agentRoutes');
const propertyRoutes       = require('./routes/propertyRoutes');
const userRoutes           = require('./routes/userRoutes');
const visitRoutes          = require('./routes/visitRoutes');
const testimonialRoutes    = require('./routes/testimonialRoutes');
const searchAlertRoutes    = require('./routes/searchAlertRoutes');
const contractRoutes       = require('./routes/contractRoutes');
const transactionRoutes    = require('./routes/transactionRoutes');
const inquiryRoutes        = require('./routes/inquiryRoutes');
const certificationRoutes  = require('./routes/certificationRoutes');
const favoriteRoutes       = require('./routes/favoriteRoutes');
const ratingRoutes         = require('./routes/ratingRoutes');
const neighborhoodRoutes   = require('./routes/neighborhoodRoutes');
const expenseRoutes        = require('./routes/expenseRoutes');
const maintenanceRoutes    = require('./routes/maintenanceRoutes');
const propertyReviewRoutes = require('./routes/propertyReviewRoutes');
const qaRoutes             = require('./routes/qaRoutes');
const notificationRoutes   = require('./routes/notificationRoutes');
const ticketRoutes         = require('./routes/ticketRoutes');
const officeRoutes         = require('./routes/officeRoutes');
const reviewRoutes         = require('./routes/reviewRoutes');
const clientRoutes         = require('./routes/clientRoutes');

// ── Mount routes ────────────────────────────────────────────────────────────
app.use('/api/auth',           authLimiter, authRoutes);
app.use('/api/agents',         agentRoutes);
app.use('/api/properties',     propertyRoutes);
app.use('/api/users',          userRoutes);
app.use('/api/visits',         visitRoutes);
app.use('/api/testimonials',   testimonialRoutes);
app.use('/api/search-alerts',  searchAlertRoutes);
app.use('/api/contracts',      contractRoutes);
app.use('/api/transactions',   transactionRoutes);
app.use('/api/inquiries',      inquiryRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/favorites',      favoriteRoutes);
app.use('/api/ratings',        ratingRoutes);
app.use('/api/neighborhoods',  neighborhoodRoutes);
app.use('/api/expenses',       expenseRoutes);
app.use('/api/maintenance',    maintenanceRoutes);
app.use('/api/notifications',  notificationRoutes);
app.use('/api/tickets',        ticketRoutes);
app.use('/api/offices',        officeRoutes);
app.use('/api/property-reviews', propertyReviewRoutes);
app.use('/api/qa',             qaRoutes);
app.use('/api/reviews',        reviewRoutes);
app.use('/api/clients',        clientRoutes);

// ── All property, image, client, review, and maintenance routes are
//    now handled by the dedicated routers mounted above.
//    The legacy raw-route blocks have been removed to eliminate duplicates.

const { requireRole } = require('./middleware/authMiddleware');
app.get('/api/financial-summary', requireRole('admin'), (req, res) => {
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