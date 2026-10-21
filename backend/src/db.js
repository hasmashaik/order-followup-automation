require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon
  },
  // Increase timeout to 15 seconds so Neon has time to wake up
  connectionTimeoutMillis: 15000, 
  idleTimeoutMillis: 30000,
  max: 10,
});

pool.on('error', (err) => {
  console.error('Unexpected PG error', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};