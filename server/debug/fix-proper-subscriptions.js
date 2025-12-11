import pool from '../config/database.js';

async function fixProperSubscriptions() {
  try {
    console.log('🎯 FIXING PROPER SUBSCRIPTIONS...\n');
    
    // Clear all subscriptions first
    await pool.query('DELETE FROM course_subscriptions');
    console.log('🧹 Cleared existing subscriptions');
    
    // Get users and their roles
    const users = await pool.query('SELECT id, name, role FROM users ORDER BY role');
    console.log('👥 Users found:', users.rows.length);
    
    // Get courses with komting assignments
    const courses = await pool.query(`
      SELECT c.id, c.course_name, c.komting_id, u.name as komting_name
      FROM courses c
      LEFT JOIN users u ON c.komting_id = u.id
      WHERE c.id IN (SELECT DISTINCT course_id FROM class_schedules)
      ORDER BY c.id
    `);
    console.log('📚 Active courses:', courses.rows.length);
    
    // Subscribe users based on role logic
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
        // Komtings see only their assigned courses
        const assignedCourses = courses.rows.filter(c => c.komting_id === user.id);
        for (const course of assignedCourses) {
          await pool.query(
            'INSERT INTO course_subscriptions (user_id, course_id) VALUES ($1, $2)',
            [user.id, course.id]
          );
        }
        console.log(`✅ ${user.name} (Komting) → ${assignedCourses.length} assigned courses`);
        
        if (assignedCourses.length === 0) {
          console.log(`⚠️  ${user.name} has no assigned courses as komting`);
        }
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
    
    console.log('\n🎉 PROPER SUBSCRIPTIONS FIXED!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixProperSubscriptions();