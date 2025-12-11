import pool from '../config/database.js';

async function fixSubscriptions() {
  try {
    console.log('=== FIXING SUBSCRIPTION ALIGNMENT ===\n');
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Clear existing subscriptions to start fresh
      console.log('🧹 Clearing existing subscriptions...');
      await client.query('DELETE FROM course_subscriptions');
      
      // Get all komtings and their assigned courses
      const komtingCourses = await client.query(`
        SELECT c.id as course_id, c.name as course_name, c.komting_id, u.name as komting_name
        FROM courses c
        JOIN users u ON c.komting_id = u.id
        WHERE c.is_active = true AND u.role = 'komting'
      `);
      
      console.log('📋 Creating proper komting subscriptions:');
      
      // Subscribe each komting to their assigned courses
      for (const course of komtingCourses.rows) {
        await client.query(
          'INSERT INTO course_subscriptions (user_id, course_id) VALUES ($1, $2)',
          [course.komting_id, course.course_id]
        );
        console.log(`  ✅ ${course.komting_name} → ${course.course_name}`);
      }
      
      // Get all admins
      const admins = await client.query(`
        SELECT id, name FROM users WHERE role = 'admin'
      `);
      
      // Get all active courses
      const allCourses = await client.query(`
        SELECT id, name FROM courses WHERE is_active = true
      `);
      
      console.log('\n📋 Creating admin subscriptions (all courses):');
      
      // Subscribe all admins to all courses
      for (const admin of admins.rows) {
        for (const course of allCourses.rows) {
          await client.query(
            'INSERT INTO course_subscriptions (user_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [admin.id, course.id]
          );
        }
        console.log(`  ✅ ${admin.name} → All ${allCourses.rows.length} courses`);
      }
      
      await client.query('COMMIT');
      console.log('\n✅ Subscription alignment fixed successfully!');
      
      // Verify the fix
      console.log('\n🔍 VERIFICATION:');
      const verification = await client.query(`
        SELECT u.name as user_name, u.role, COUNT(cs.course_id) as subscribed_courses
        FROM users u
        LEFT JOIN course_subscriptions cs ON u.id = cs.user_id
        GROUP BY u.id, u.name, u.role
        ORDER BY u.role, u.name
      `);
      
      verification.rows.forEach(user => {
        console.log(`  ${user.user_name} (${user.role}): ${user.subscribed_courses} courses`);
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

fixSubscriptions();