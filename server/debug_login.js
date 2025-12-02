import bcrypt from 'bcryptjs';
import pool from './config/database.js';

console.log('🔍 Debug login credentials...\n');

try {
  // Check all users in database
  const result = await pool.query('SELECT id, name, email, role FROM users ORDER BY created_at DESC LIMIT 10');
  
  console.log('📋 Users in database:');
  if (result.rows.length === 0) {
    console.log('❌ No users found in database!');
  } else {
    result.rows.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
    });
  }

  // Test login with specific credentials
  console.log('\n🧪 Testing login with yehezkiel@usu.ac.id...');
  
  const loginResult = await pool.query(
    'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
    ['yehezkiel@usu.ac.id']
  );

  if (loginResult.rows.length === 0) {
    console.log('❌ User not found!');
  } else {
    const user = loginResult.rows[0];
    console.log('✅ User found:', user.name);
    
    // Test password
    const testPassword = 'password123';
    const isValid = await bcrypt.compare(testPassword, user.password_hash);
    console.log(`Password "${testPassword}" is ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    
    // Show password hash for debugging
    console.log('Password hash (first 20 chars):', user.password_hash.substring(0, 20) + '...');
  }

} catch (error) {
  console.log('❌ Error:', error.message);
}
