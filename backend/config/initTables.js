const bcrypt = require('bcryptjs');

async function initTables(db) {
  const queries = [
    "ALTER TABLE properties ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'BUY'",
    `CREATE TABLE IF NOT EXISTS propertyimages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      property_id INT NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      eshte_kryesore BOOLEAN DEFAULT false,
      renditja INT DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS propertyfeatures (
      id INT AUTO_INCREMENT PRIMARY KEY,
      property_id INT NOT NULL,
      emertimi VARCHAR(100) NOT NULL,
      vlera VARCHAR(100) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'client',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS agents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      license_number VARCHAR(100),
      specialization VARCHAR(100),
      commission_percentage DECIMAL(5,2),
      zone VARCHAR(255),
      status VARCHAR(50) DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS clients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      emri VARCHAR(100),
      mbiemri VARCHAR(100),
      telefoni VARCHAR(50),
      email VARCHAR(255),
      phone VARCHAR(50),
      address VARCHAR(255),
      buxheti_max DECIMAL(15,2),
      preferencat TEXT,
      lloji_klientit VARCHAR(50)
    )`,
    `CREATE TABLE IF NOT EXISTS favorites (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_id INT NOT NULL,
      property_id INT NOT NULL,
      UNIQUE KEY unique_favorite (client_id, property_id)
    )`,
    `CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      agent_id INT NOT NULL,
      client_id INT,
      vleresimi INT,
      komenti TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS certifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      agent_id INT DEFAULT 1,
      document_url VARCHAR(500) NOT NULL,
      type VARCHAR(100) DEFAULT 'Passport / ID',
      status VARCHAR(50) DEFAULT 'Pending',
      expires_at DATE NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS contact_inquiries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      agent_id INT DEFAULT 1,
      client_name VARCHAR(255) NOT NULL,
      client_email VARCHAR(255),
      message TEXT NOT NULL,
      reply TEXT NULL,
      status VARCHAR(50) DEFAULT 'new',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS testimonials (
      id INT AUTO_INCREMENT PRIMARY KEY,
      klienti_emri VARCHAR(100) NOT NULL,
      teksti TEXT NOT NULL,
      foto_url VARCHAR(255) DEFAULT NULL,
      is_featured TINYINT(1) DEFAULT 0,
      data_publikimit TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS searchalerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_id INT NOT NULL DEFAULT 1,
      qyteti VARCHAR(50) DEFAULT NULL,
      cmimi_max DECIMAL(15,2) DEFAULT NULL,
      dhomat INT DEFAULT NULL,
      lloji_prones VARCHAR(50) DEFAULT NULL,
      data_krijimit TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS MaintenanceTickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      property_id INT,
      tenant_id INT,
      title VARCHAR(255),
      description TEXT,
      status VARCHAR(50) DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS AgencyExpenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category VARCHAR(100),
      amount DECIMAL(15,2),
      description TEXT,
      expense_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS visits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      property_id INT NOT NULL,
      user_id INT NOT NULL,
      visit_date DATE NOT NULL,
      visit_time TIME NOT NULL,
      status ENUM('PENDING','APPROVED','CANCELLED') DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  ];

  for (const sql of queries) {
    try {
      await db.query(sql);
    } catch (err) {
      if (!err.message.includes('Duplicate column')) {
        console.warn('Table init warning:', err.message);
      }
    }
  }

  try {
    await db.query('ALTER TABLE users ADD COLUMN username VARCHAR(255)');
  } catch (_) { /* column may exist */ }
  try {
    await db.query('ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT \'client\'');
  } catch (_) { /* column may exist */ }

  const [rows] = await db.query('SELECT COUNT(*) AS count FROM users');
  if (rows[0].count === 0) {
    const hash = await bcrypt.hash('password123', 10);
    const seedUsers = [
      ['Gerta Borovci', 'gerta@ubt-uni.net', 'user'],
      ['Alba Rudari', 'alba@ubt-uni.net', 'admin'],
      ['Eljesa Bytyqi', 'eljesa@ubt-uni.net', 'agent'],
      ['Elza Shabani', 'elza@ubt-uni.net', 'user'],
    ];
    for (const [username, email, role] of seedUsers) {
      await db.query(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, hash, role]
      );
    }
    const [agentUser] = await db.query("SELECT id FROM users WHERE email = 'eljesa@ubt-uni.net' LIMIT 1");
    if (agentUser.length) {
      await db.query(
        `INSERT INTO agents (user_id, license_number, specialization, commission_percentage, zone, status)
         VALUES (?, 'LIC-2026-001', 'Sale', 3.5, 'Prishtinë', 'Active')`,
        [agentUser[0].id]
      );
    }
    console.log('✅ Default users and agent seeded');
  }
}

module.exports = initTables;
