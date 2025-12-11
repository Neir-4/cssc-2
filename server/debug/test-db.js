import pool from './config/database.js';
import bcrypt from 'bcryptjs';

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...\n');
    
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Database connected successfully');
    console.log('📅 Current time:', result.rows[0].current_time);
    console.log('🗄️  Database version:', result.rows[0].db_version.split(' ')[0]);
    
    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Users table does not exist. Run migrations first:');
      console.log('   npm run migrate');
      console.log('   npm run seed');
      return;
    }
    
    console.log('✅ Users table exists');
    
    // Check users count
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`👥 Total users in database: ${userCount.rows[0].count}`);
    
    if (userCount.rows[0].count === '0') {
      console.log('❌ No users found. Run seeding:');
      console.log('   npm run seed');
      return;
    }
    
    // Show all users
    const users = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY id');
    console.log('\n📋 All users in database:');
    users.rows.forEach(user => {
      console.log(`   ${user.id}. ${user.name} (${user.email}) - ${user.role}`);
    });
    
    // Test login credentials for test users
    console.log('\n🔐 Testing login credentials...');
    const testCredentials = [
      { email: 'yehezkiel@usu.ac.id', password: 'password123' },
      { email: 'syukron@usu.ac.id', password: 'password123' },
      { email: 'alya@usu.ac.id', password: 'password123' }
    ];
    
    for (const cred of testCredentials) {
      try {
        const userResult = await pool.query(
          'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
          [cred.email]
        );
        
        if (userResult.rows.length === 0) {
          console.log(`❌ User not found: ${cred.email}`);
          continue;
        }
        
        const user = userResult.rows[0];
        const isValidPassword = await bcrypt.compare(cred.password, user.password_hash);
        
        if (isValidPassword) {
          console.log(`✅ ${cred.email} - Password correct`);
        } else {
          console.log(`❌ ${cred.email} - Password incorrect`);
        }
      } catch (error) {
        console.log(`❌ Error testing ${cred.email}:`, error.message);
      }
    }
    
    console.log('\n🎉 Database test completed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Suggestions:');
      console.log('   1. Make sure PostgreSQL is running');
      console.log('   2. Check your .env file database credentials');
      console.log('   3. Verify database name exists: cssc_db');
    }
  } finally {
    await pool.end();
  }
}

testDatabase();