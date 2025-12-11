import bcrypt from 'bcryptjs';
import pool from './config/database.js';
import fs from 'fs';
import path from 'path';

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

async function phase1Setup() {
  try {
    console.log('🚀 Starting Phase 1: Foundation Fixes');
    console.log('=====================================');
    
    // Step 1: Test database connection
    console.log('\n1️⃣ Testing database connection...');
    const connectionTest = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful!');
    
    // Step 2: Fix user roles
    console.log('\n2️⃣ Fixing user role constraints...');
    await runMigration('014_fix_user_roles.sql');
    
    // Step 3: Reset all passwords
    console.log('\n3️⃣ Resetting all user passwords...');
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 RETURNING id, name, email, role',
      [hashedPassword]
    );
    
    console.log('✅ Password reset successful for all users:');
    result.rows.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    // Step 4: Verify final state
    console.log('\n4️⃣ Verifying final state...');
    const users = await pool.query('SELECT id, name, email, role FROM users ORDER BY role, name');
    
    console.log('\n📋 Final user list:');
    users.rows.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    console.log('\n🎉 Phase 1 Setup Complete!');
    console.log('==========================');
    console.log(`🔑 All users can now login with password: "${newPassword}"`);
    console.log('🎯 Simplified roles: Admin and Komting only');
    console.log('✅ Authentication system is now functional');
    
  } catch (error) {
    console.error('💥 Phase 1 setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

phase1Setup();