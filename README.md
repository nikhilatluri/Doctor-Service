# Doctor Service

The Doctor Service is a microservice for managing doctor information in the Hospital Management System. It provides REST APIs for creating, reading, updating, and deleting doctor records, as well as searching doctors by specialization and availability.

## Features

- Create new doctor profiles with specialization and license details
- Retrieve doctor information by ID
- Search doctors by name, specialization, or status
- Update doctor information
- Delete doctor records
- Comprehensive validation using Joi
- Structured logging with PII masking (Winston)
- Prometheus metrics for monitoring
- Health check endpoints
- Swagger/OpenAPI documentation
- Rate limiting and security (Helmet, CORS)

## Technology Stack

- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Validation**: Joi
- **Logging**: Winston
- **Metrics**: Prometheus (prom-client)
- **Documentation**: Swagger/OpenAPI 3.0
- **Security**: Helmet, CORS, express-rate-limit

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 13 or higher
- npm or yarn

## Installation

1. Clone the repository and navigate to the service directory:
```bash
cd hms-doctor-service
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=3002
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hms_doctors
DB_USER=postgres
DB_PASSWORD=your_password
```

5. Start the service:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Database Schema

The service creates the following schema:

```sql
CREATE TABLE doctors (
  doctor_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  specialization VARCHAR(100) NOT NULL,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  experience_years INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Health Checks

- `GET /health` - Service health status with database connectivity
- `GET /ready` - Readiness probe for Kubernetes
- `GET /live` - Liveness probe for Kubernetes

### Metrics

- `GET /metrics` - Prometheus metrics endpoint

### Doctor Management

#### Create Doctor
```http
POST /v1/doctors
Content-Type: application/json

{
  "name": "Dr. John Smith",
  "email": "john.smith@hospital.com",
  "phone": "9876543210",
  "specialization": "Cardiology",
  "license_number": "MED123456",
  "experience_years": 10
}
```

Response: `201 Created`
```json
{
  "success": true,
  "data": {
    "doctor_id": 1,
    "name": "Dr. John Smith",
    "email": "john.smith@hospital.com",
    "phone": "9876543210",
    "specialization": "Cardiology",
    "license_number": "MED123456",
    "experience_years": 10,
    "status": "ACTIVE",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "correlationId": "uuid"
}
```

#### Get All Doctors
```http
GET /v1/doctors?page=1&limit=10
```

Response: `200 OK`
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 50,
    "totalPages": 5
  },
  "correlationId": "uuid"
}
```

#### Search Doctors
```http
GET /v1/doctors/search?specialization=Cardiology&status=ACTIVE
```

#### Get Doctor by ID
```http
GET /v1/doctors/1
```

Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "doctor_id": 1,
    "name": "Dr. John Smith",
    "email": "john.smith@hospital.com",
    ...
  },
  "correlationId": "uuid"
}
```

#### Update Doctor
```http
PUT /v1/doctors/1
Content-Type: application/json

{
  "name": "Dr. John Smith Jr.",
  "experience_years": 12
}
```

#### Delete Doctor
```http
DELETE /v1/doctors/1
```

## API Documentation

Interactive API documentation is available via Swagger UI:

```
http://localhost:3002/api-docs
```

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "DOCTOR_NOT_FOUND",
    "message": "Doctor not found",
    "correlationId": "uuid",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

Common error codes:
- `DOCTOR_NOT_FOUND` (404)
- `DUPLICATE_EMAIL` (409)
- `DUPLICATE_LICENSE` (409)
- `VALIDATION_ERROR` (400)
- `INTERNAL_ERROR` (500)

## Logging

The service uses Winston for structured JSON logging with PII masking:

- Email addresses are masked (e.g., `j***n@hospital.com`)
- Phone numbers are masked (e.g., `******3210`)
- Passwords and tokens are fully redacted

Logs are written to:
- Console (with colors)
- `logs/combined.log` (all logs)
- `logs/error.log` (error logs only)

Each log entry includes a `correlationId` for request tracing.

## Metrics

Prometheus metrics are exposed at `/metrics`:

- `http_request_duration_ms` - HTTP request duration histogram
- `http_requests_total` - Total HTTP requests counter
- `doctors_created_total` - Total doctors created counter
- `doctors_active_total` - Active doctors gauge
- Default Node.js metrics (memory, CPU, etc.)

## Security

- **Helmet**: Sets security-related HTTP headers
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: 100 requests per 15 minutes per IP (configurable)
- **Input Validation**: All inputs validated with Joi schemas
- **PII Masking**: Sensitive data masked in logs

## Docker

Build the Docker image:
```bash
docker build -t hms-doctor-service .
```

Run the container:
```bash
docker run -p 3002:3002 \
  -e DB_HOST=host.docker.internal \
  -e DB_NAME=hms_doctors \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  hms-doctor-service
```

## Load Seed Data

To load sample doctor data from CSV:

```bash
npm run load-seed
```

The seed data file should be located at: `../shared/seed-data/hms_doctors.csv`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3002 |
| NODE_ENV | Environment (development/production) | development |
| DB_HOST | PostgreSQL host | localhost |
| DB_PORT | PostgreSQL port | 5432 |
| DB_NAME | Database name | hms_doctors |
| DB_USER | Database user | postgres |
| DB_PASSWORD | Database password | postgres |
| LOG_LEVEL | Logging level (error/warn/info/debug) | info |
| CORS_ORIGIN | CORS allowed origins | * |
| RATE_LIMIT_WINDOW_MS | Rate limit window in ms | 900000 |
| RATE_LIMIT_MAX_REQUESTS | Max requests per window | 100 |

## Architecture

The Doctor Service follows a layered architecture:

```
src/
├── index.js                 # Application entry point
├── config/
│   ├── database.js          # Database connection and schema
│   └── swagger.js           # Swagger/OpenAPI configuration
├── controllers/
│   └── doctor.controller.js # Business logic
├── routes/
│   ├── doctor.routes.js     # API route definitions
│   └── health.routes.js     # Health check routes
├── middleware/
│   ├── errorHandler.js      # Global error handler
│   ├── requestLogger.js     # Request logging
│   └── validator.js         # Joi validation middleware
├── utils/
│   ├── logger.js            # Winston logger configuration
│   ├── metrics.js           # Prometheus metrics
│   └── piiMasker.js         # PII masking utility
└── scripts/
    └── loadSeedData.js      # Seed data loader
```

## Inter-Service Communication

This service is designed to work with other services in the HMS:

- **Appointment Service** (3003): Validates doctor availability
- **Patient Service** (3001): Cross-references for appointments

## Development

Run tests:
```bash
npm test
```

Run with development logging:
```bash
LOG_LEVEL=debug npm run dev
```

## License

MIT
