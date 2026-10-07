// Francesco Simeoni - Alessandro Marchiorato | PROGETTO TAW | A.A 2025/2026

const { Pool } = require('pg');
require('dotenv').config(({ path: 'credentials.env' }));

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

module.exports = pool;