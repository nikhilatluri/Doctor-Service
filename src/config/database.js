const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  logger.info('Database connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected database error', { error: err.message });
});

const initDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS doctors (
        doctor_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        department VARCHAR(100) NOT NULL,
        specialization VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        max_appointments_per_day INTEGER DEFAULT 16,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS doctor_slots (
        slot_id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctors(doctor_id) ON DELETE CASCADE,
        slot_date DATE NOT NULL,
        slot_start TIME NOT NULL,
        slot_end TIME NOT NULL,
        status VARCHAR(20) DEFAULT 'AVAILABLE',
        appointment_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(doctor_id, slot_date, slot_start)
      );

      CREATE INDEX IF NOT EXISTS idx_doctors_department ON doctors(department);
      CREATE INDEX IF NOT EXISTS idx_doctors_status ON doctors(status);
      CREATE INDEX IF NOT EXISTS idx_slots_doctor_date ON doctor_slots(doctor_id, slot_date);
      CREATE INDEX IF NOT EXISTS idx_slots_status ON doctor_slots(status);
    `);
    logger.info('Database schema initialized');
  } catch (error) {
    logger.error('Failed to initialize database schema', { error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { pool, initDatabase };
