require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

const loadSeedData = async () => {
  const client = await pool.connect();
  try {
    logger.info('Loading seed data for doctors...');

    // Read CSV file
    const csvPath = path.join(__dirname, '../../../shared/seed-data/hms_doctors.csv');
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');

    // Skip header and process each line
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const [doctor_id, name, email, phone, specialization, license_number, experience_years, created_at] = values;

      await client.query(
        `INSERT INTO doctors (doctor_id, name, email, phone, specialization, license_number, experience_years, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (email) DO NOTHING`,
        [doctor_id, name, email, phone, specialization, license_number, experience_years, created_at]
      );
    }

    logger.info(`Loaded ${lines.length - 1} doctors from seed data`);
  } catch (error) {
    logger.error('Failed to load seed data', { error: error.message });
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

loadSeedData()
  .then(() => {
    logger.info('Seed data loaded successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Failed to load seed data', { error: error.message });
    process.exit(1);
  });
