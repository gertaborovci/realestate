require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./db');
const initTables = require('./config/initTables');
const { errorHandler } = require('./middleware/errorHandler');

const featureRoutes = require('./routes/featureRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const agentRoutes = require('./routes/agentRoutes');
const clientRoutes = require('./routes/clientRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const certificationRoutes = require('./routes/certificationRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const searchAlertRoutes = require('./routes/searchAlertRoutes');
const { maintenanceRouter, expensesRouter } = require('./routes/financeRoutes');
const visitRoutes = require('./routes/visitRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (_req, res) => {
  res.type('html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Find Home API</title>
</head>
<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:3rem auto;padding:0 1rem;color:#111;">
  <h1>Backend is running</h1>
  <p>Find Home API is ready on port ${PORT}.</p>
  <p><a href="/api">View API endpoints (JSON)</a></p>
</body>
</html>`);
});

app.get('/api', (req, res) => {
  res.json({
    message: 'Find Home API',
    endpoints: {
      properties: '/api/properties',
      propertyFeatures: '/api/properties/:id/features',
      propertyImages: '/api/properties/:id/images',
      auth: { register: 'POST /api/auth/register', login: 'POST /api/auth/login' },
      users: '/api/users',
      agents: '/api/agents',
      clients: '/api/clients',
      favorites: '/api/favorites',
      reviews: '/api/reviews',
      certifications: '/api/certifications',
      inquiries: '/api/inquiries',
      testimonials: '/api/testimonials',
      searchAlerts: '/api/search-alerts',
      maintenance: '/api/maintenance',
      expenses: '/api/expenses',
      visits: '/api/visits',
    },
  });
});

// Feature routes must be registered before generic /:id property routes
app.use('/api/properties', featureRoutes);
app.use('/api/properties', propertyRoutes);

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/search-alerts', searchAlertRoutes);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/visits', visitRoutes);

// Legacy review path used by older frontend calls
app.get('/api/reviews/:agent_id', async (req, res, next) => {
  req.params.agent_id = req.params.agent_id;
  const reviewController = require('./controllers/reviewController');
  try {
    await reviewController.getByAgent(req, res);
  } catch (err) {
    next(err);
  }
});

app.use(errorHandler);

async function startServer() {
  try {
    await initTables(db);
    app.listen(PORT, () => {
      console.log(`🚀 Server started on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();
