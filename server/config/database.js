import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const isServerless = !!process.env.VERCEL;
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.PG_POOL_MAX, 10) || (isServerless ? 3 : 20),
  idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT_MS, 10) || (isServerless ? 10000 : 30000),
  connectionTimeoutMillis: parseInt(process.env.PG_CONN_TIMEOUT_MS, 10) || 5000,
  keepAlive: true,
};

const globalKey = '__cssc_pg_pool__';
const pool = isServerless
  ? (globalThis[globalKey] || (globalThis[globalKey] = new Pool(poolConfig)))
  : new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

export default pool;
