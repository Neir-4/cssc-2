import bcrypt from 'bcryptjs';
import pool from './config/database.js';

async function resetPasswords() {
  try {
    console.log('🔐 Resetting all user passwords to "admin123"...');
    
    // Hash the new password
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update all users with new password
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 RETURNING id, name, email, role',
      [hashedPassword]
    );
    
    console.log('✅ Password reset successful for all users:');
    result.rows.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    console.log(`\n🎯 All users can now login with password: "${newPassword}"`);
    
  } catch (error) {
    console.error('❌ Password reset failed:', error.message);
  } finally {
    await pool.end();
  }
}

resetPasswords();