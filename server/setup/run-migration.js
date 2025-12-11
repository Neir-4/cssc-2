import fs from 'fs';
import path from 'path';
import pool from './config/database.js';

async function runMigration(migrationFile) {
  try {
    console.log(`🔄 Running migration: ${migrationFile}`);
    
    const migrationPath = path.join(process.cwd(), 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(sql);
    console.log(`✅ Migration completed: ${migrationFile}`);
    
  } catch (error) {
    console.error(`❌ Migration failed: ${migrationFile}`, error.message);
    throw error;
  }
}

async function runAllMigrations() {
  try {
    console.log('🚀 Starting Phase 1 migrations...');
    
    // Run the role fix migration
    await runMigration('014_fix_user_roles.sql');
    
    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('💥 Migration process failed:', error);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllMigrations();
}

export default runAllMigrations;