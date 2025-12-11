import pool from '../config/database.js';

async function checkSubscriptionAlignment() {
  try {
    console.log('=== SUBSCRIPTION ALIGNMENT DIAGNOSTIC ===\n');
    
    // Check users and their roles
    const users = await pool.query(`
      SELECT id, name, email, role 
      FROM users 
      ORDER BY role, id
    `);
    console.log('👥 USERS:');
    users.rows.forEach(user => {
      console.log(`  ${user.id}: ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    // Check course subscriptions
    const subscriptions = await pool.query(`
      SELECT cs.user_id, cs.course_id, u.name as user_name, u.role, c.name as course_name, c.komting_id
      FROM course_subscriptions cs
      JOIN users u ON cs.user_id = u.id
      JOIN courses c ON cs.course_id = c.id
      ORDER BY cs.user_id, cs.course_id
    `);
    console.log('\n📋 COURSE SUBSCRIPTIONS:');
    if (subscriptions.rows.length === 0) {
      console.log('  ❌ NO SUBSCRIPTIONS FOUND! This is the problem.');
    } else {
      subscriptions.rows.forEach(sub => {
        console.log(`  User ${sub.user_id} (${sub.user_name}, ${sub.role}) → Course ${sub.course_id} (${sub.course_name})`);
        if (sub.role === 'komting' && sub.user_id !== sub.komting_id) {
          console.log(`    ⚠️  WARNING: Komting subscription mismatch!`);
        }
      });
    }
    
    // Check courses and their komting assignments
    const courses = await pool.query(`
      SELECT c.id, c.name, c.komting_id, u.name as komting_name, c.is_active
      FROM courses c
      LEFT JOIN users u ON c.komting_id = u.id
      ORDER BY c.id
    `);
    console.log('\n📚 COURSES & KOMTING ASSIGNMENTS:');
    courses.rows.forEach(course => {
      console.log(`  ${course.id}: ${course.name} - Komting: ${course.komting_name || 'NONE'} (ID: ${course.komting_id || 'NULL'}), Active: ${course.is_active}`);
    });
    
    // Check what schedule API would return for each user
    console.log('\n🔍 SCHEDULE API SIMULATION:');
    for (const user of users.rows) {
      console.log(`\n  Testing for ${user.name} (${user.role}):`);
      
      let query = `
        SELECT c.id, c.course_code, c.name
        FROM courses c
        WHERE c.is_active = true
      `;
      let queryParams = [];
      
      if (user.role === 'komting') {
        query += ` AND c.komting_id = $1`;
        queryParams.push(user.id);
      }
      
      const userCourses = await pool.query(query, queryParams);
      
      if (userCourses.rows.length === 0) {
        console.log(`    ❌ No courses found for ${user.name}`);
      } else {
        console.log(`    ✅ Found ${userCourses.rows.length} courses:`);
        userCourses.rows.forEach(course => {
          console.log(`      - ${course.course_code}: ${course.name}`);
        });
      }
    }
    
    // Check for missing subscriptions
    console.log('\n🔧 SUBSCRIPTION RECOMMENDATIONS:');
    
    // Find komtings without subscriptions to their own courses
    const komtingIssues = await pool.query(`
      SELECT u.id as user_id, u.name as user_name, c.id as course_id, c.name as course_name
      FROM users u
      JOIN courses c ON u.id = c.komting_id
      LEFT JOIN course_subscriptions cs ON u.id = cs.user_id AND c.id = cs.course_id
      WHERE u.role = 'komting' AND cs.user_id IS NULL AND c.is_active = true
    `);
    
    if (komtingIssues.rows.length > 0) {
      console.log('  ❌ Missing komting subscriptions:');
      komtingIssues.rows.forEach(issue => {
        console.log(`    - ${issue.user_name} should be subscribed to ${issue.course_name}`);
      });
    } else {
      console.log('  ✅ All komtings are properly subscribed to their courses');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkSubscriptionAlignment();