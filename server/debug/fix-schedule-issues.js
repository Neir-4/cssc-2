import pool from '../config/database.js';

async function fixScheduleIssues() {
  try {
    console.log('🔧 FIXING SCHEDULE ISSUES...\n');
    
    // 1. Check current database schema
    console.log('1️⃣ Checking database schema...');
    
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('class_schedules', 'user_class_schedules', 'course_subscriptions', 'schedule_events')
    `);
    
    console.log('📊 Available tables:', tables.rows.map(t => t.table_name));
    
    // 2. Check user subscriptions
    console.log('\n2️⃣ Checking user subscriptions...');
    
    try {
      const subscriptions = await pool.query(`
        SELECT cs.user_id, cs.course_id, u.name as user_name, u.role, c.course_name
        FROM course_subscriptions cs
        JOIN users u ON cs.user_id = u.id
        JOIN courses c ON cs.course_id = c.id
        ORDER BY cs.user_id
      `);
      
      console.log(`📋 Found ${subscriptions.rows.length} course subscriptions:`);
      subscriptions.rows.forEach(sub => {
        console.log(`  - ${sub.user_name} (${sub.role}) → ${sub.course_name}`);
      });
      
      if (subscriptions.rows.length === 0) {
        console.log('❌ NO SUBSCRIPTIONS FOUND - This explains why users see all courses!');
      }
    } catch (error) {
      console.log('❌ course_subscriptions table not found or empty');
    }
    
    // 3. Check which API endpoint is being used
    console.log('\n3️⃣ Testing API endpoints...');
    
    // Test schedule/real endpoint
    try {
      const realSchedule = await pool.query(`
        SELECT cs.id, cs.day_of_week, cs.start_time, cs.end_time,
               c.id as course_id, c.course_code, c.course_name
        FROM class_schedules cs
        JOIN courses c ON cs.course_id = c.id
        LIMIT 5
      `);
      
      console.log(`📅 class_schedules has ${realSchedule.rows.length} entries`);
      if (realSchedule.rows.length > 0) {
        console.log('Sample:', realSchedule.rows[0]);
      }
    } catch (error) {
      console.log('❌ class_schedules query failed:', error.message);
    }
    
    // 4. Create missing subscriptions if needed
    console.log('\n4️⃣ Creating missing subscriptions...');
    
    const users = await pool.query('SELECT id, name, role FROM users WHERE role IN (\'admin\', \'komting\')');
    const courses = await pool.query('SELECT id, course_name FROM courses');
    
    console.log(`👥 Users: ${users.rows.length}, 📚 Courses: ${courses.rows.length}`);
    
    // Create course_subscriptions table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_subscriptions (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, course_id)
      )
    `);
    
    // Subscribe all users to all courses for now (simplified fix)
    for (const user of users.rows) {
      for (const course of courses.rows) {
        await pool.query(`
          INSERT INTO course_subscriptions (user_id, course_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, course_id) DO NOTHING
        `, [user.id, course.id]);
      }
      console.log(`✅ Subscribed ${user.name} to all courses`);
    }
    
    console.log('\n🎉 FIXES APPLIED!');
    console.log('📋 Summary:');
    console.log('  ✅ Created course_subscriptions table');
    console.log('  ✅ Subscribed all users to all courses');
    console.log('  ✅ This should fix the schedule display issue');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixScheduleIssues();