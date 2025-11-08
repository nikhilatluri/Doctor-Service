const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Doctor Service API',
      version: '1.0.0',
      description: 'Hospital Management System - Doctor Service API Documentation',
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              example: 'DOCTOR_NOT_FOUND'
            },
            message: {
              type: 'string',
              example: 'Doctor not found'
            },
            correlationId: {
              type: 'string',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
