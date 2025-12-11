import pool from './config/database.js';

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Database connection successful!');
    console.log('📊 Database info:', {
      time: result.rows[0].current_time,
      version: result.rows[0].db_version.split(' ')[0]
    });
    
    // Test users table
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log('👥 Current users count:', usersCount.rows[0].count);
    
    // Show existing users
    const users = await pool.query('SELECT id, name, email, role FROM users');
    console.log('📋 Existing users:');
    users.rows.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure PostgreSQL is running and credentials are correct');
    }
  } finally {
    await pool.end();
  }
}

testConnection();