import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Get all migration files
    const migrationsDir = __dirname;
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') && file !== 'migrate.js')
      .sort();
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Create migrations table to track executed migrations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Get executed migrations
    const executedResult = await pool.query('SELECT filename FROM migrations ORDER BY filename');
    const executedMigrations = executedResult.rows.map(row => row.filename);
    
    // Run pending migrations
    for (const file of migrationFiles) {
      if (!executedMigrations.includes(file)) {
        console.log(`Running migration: ${file}`);
        
        const filePath = path.join(migrationsDir, file);
        const migrationSQL = fs.readFileSync(filePath, 'utf8');
        
        await pool.query(migrationSQL);
        
        // Record migration as executed
        await pool.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
        
        console.log(`✅ Migration ${file} completed`);
      } else {
        console.log(`⏭️  Migration ${file} already executed`);
      }
    }
    
    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export default runMigrations;
