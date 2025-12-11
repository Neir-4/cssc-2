import pool from './config/database.js';
import bcrypt from 'bcryptjs';

async function fixPasswords() {
  try {
    console.log('🔧 Fixing user passwords...\n');
    
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Reset ALL users to admin123
    const allUsersResult = await pool.query('SELECT email FROM users');
    const testUsers = allUsersResult.rows.map(row => row.email);
    
    for (const email of testUsers) {
      try {
        const result = await pool.query(
          'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, name, email, role',
          [hashedPassword, email]
        );
        
        if (result.rows.length > 0) {
          const user = result.rows[0];
          console.log(`✅ Updated password for: ${user.name} (${user.email}) - ${user.role}`);
        } else {
          console.log(`⚠️  User not found: ${email}`);
        }
      } catch (error) {
        console.log(`❌ Error updating ${email}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Password reset completed! All users now have password: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Password fix failed:', error.message);
  } finally {
    await pool.end();
  }
}

fixPasswords();