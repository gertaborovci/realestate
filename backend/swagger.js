const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'KosovaNest Real Estate API',
      version: '1.0.0',
      description:
        'REST API for the KosovaNest real estate platform. ' +
        'Supports property listings, agent management, contracts, visits, ' +
        'notifications, and more.',
      contact: { name: 'KosovaNest Team' },
    },
    servers: [{ url: 'http://localhost:5000', description: 'Development server' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Obtain a token from POST /api/auth/login, then paste it here.',
        },
      },
      schemas: {
        Property: {
          type: 'object',
          properties: {
            id:        { type: 'integer' },
            title:     { type: 'string' },
            price:     { type: 'number' },
            location:  { type: 'string' },
            status:    { type: 'string', enum: ['Available', 'Sold', 'Rented'] },
            type:      { type: 'string', enum: ['BUY', 'RENT'] },
            rooms:     { type: 'integer' },
            bathrooms: { type: 'integer' },
            area:      { type: 'number' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id:       { type: 'integer' },
            username: { type: 'string' },
            email:    { type: 'string', format: 'email' },
            role:     { type: 'string', enum: ['admin', 'agent', 'user'] },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message:      { type: 'string' },
            user:         { $ref: '#/components/schemas/User' },
            token:        { type: 'string', description: 'Short-lived JWT access token (15 min)' },
            refreshToken: { type: 'string', description: 'Long-lived refresh token (30 days)' },
          },
        },
        Contract: {
          type: 'object',
          properties: {
            id:               { type: 'integer' },
            contract_number:  { type: 'string', example: 'CNT-2024-0001' },
            user_id:          { type: 'integer' },
            property_id:      { type: 'integer' },
            agent_id:         { type: 'integer' },
            type:             { type: 'string', enum: ['Sale', 'Rent'] },
            property_price:   { type: 'number' },
            deposit_amount:   { type: 'number' },
            status:           { type: 'string' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id:         { type: 'integer' },
            user_id:    { type: 'integer' },
            type:       { type: 'string', enum: ['system', 'broadcast', 'info', 'alert', 'warning'] },
            title:      { type: 'string' },
            message:    { type: 'string' },
            is_read:    { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Agent: {
          type: 'object',
          properties: {
            id:                    { type: 'integer' },
            user_id:               { type: 'integer' },
            license_number:        { type: 'string' },
            specialization:        { type: 'string' },
            commission_percentage: { type: 'number', minimum: 0, maximum: 100 },
            zone:                  { type: 'string' },
            status:                { type: 'string', enum: ['Active', 'Inactive'] },
            bio:                   { type: 'string' },
            phone:                 { type: 'string' },
            avg_rating:            { type: 'number' },
            deals_closed:          { type: 'integer' },
          },
        },
        Client: {
          type: 'object',
          properties: {
            id:             { type: 'integer' },
            user_id:        { type: 'integer' },
            emri:           { type: 'string' },
            mbiemri:        { type: 'string' },
            telefoni:       { type: 'string' },
            email:          { type: 'string', format: 'email' },
            buxheti_max:    { type: 'number' },
            lloji_klientit: { type: 'string' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id:          { type: 'integer' },
            contract_id: { type: 'integer' },
            amount:      { type: 'number' },
            status:      { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] },
            method:      { type: 'string' },
            created_at:  { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'],   // JSDoc comments in all route files
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
