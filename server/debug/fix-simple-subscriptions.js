import pool from '../config/database.js';

async function fixSimpleSubscriptions() {
  try {
    console.log('🎯 FIXING SIMPLE SUBSCRIPTIONS...\n');
    
    // Clear all subscriptions first
    await pool.query('DELETE FROM course_subscriptions');
    console.log('🧹 Cleared existing subscriptions');
    
    // Get users and their roles
    const users = await pool.query('SELECT id, name, role FROM users ORDER BY role');
    console.log('👥 Users found:', users.rows.length);
    
    // Get only courses that have actual schedules (the 6 main courses)
    const courses = await pool.query(`
      SELECT DISTINCT c.id, c.course_name
      FROM courses c
      JOIN class_schedules cs ON c.id = cs.course_id
      ORDER BY c.id
    `);
    console.log('📚 Active courses with schedules:', courses.rows.length);
    
    // Subscribe users based on simple logic
    for (const user of users.rows) {
      if (user.role === 'admin') {
        // Admins see all active courses
        for (const course of courses.rows) {
          await pool.query(
            'INSERT INTO course_subscriptions (user_id, course_id) VALUES ($1, $2)',
            [user.id, course.id]
          );
        }
        console.log(`✅ ${user.name} (Admin) → All ${courses.rows.length} courses`);
        
      } else if (user.role === 'komting') {
        // For now, komtings see 2 specific courses (can be customized later)
        const komtingCourses = courses.rows.slice(0, 2); // First 2 courses
        for (const course of komtingCourses) {
          await pool.query(
            'INSERT INTO course_subscriptions (user_id, course_id) VALUES ($1, $2)',
            [user.id, course.id]
          );
        }
        console.log(`✅ ${user.name} (Komting) → ${komtingCourses.length} courses`);
      }
    }
    
    // Verify final subscriptions
    const finalSubs = await pool.query(`
      SELECT u.name, u.role, COUNT(cs.course_id) as course_count
      FROM users u
      LEFT JOIN course_subscriptions cs ON u.id = cs.user_id
      GROUP BY u.id, u.name, u.role
      ORDER BY u.role, u.name
    `);
    
    console.log('\n📊 FINAL SUBSCRIPTION COUNTS:');
    finalSubs.rows.forEach(sub => {
      console.log(`  ${sub.name} (${sub.role}): ${sub.course_count} courses`);
    });
    
    console.log('\n🎉 SIMPLE SUBSCRIPTIONS FIXED!');
    console.log('📋 Result: Admins see all courses, Komtings see 2 courses');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixSimpleSubscriptions();