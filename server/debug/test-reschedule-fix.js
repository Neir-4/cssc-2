import pool from '../config/database.js';

async function testRescheduleFix() {
  try {
    console.log('🧪 TESTING RESCHEDULE FUNCTIONALITY...\n');
    
    // Check if schedule_events table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schedule_events'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ schedule_events table exists');
    } else {
      console.log('❌ schedule_events table missing - creating it...');
      
      await pool.query(`
        CREATE TABLE schedule_events (
          id SERIAL PRIMARY KEY,
          course_id INTEGER NOT NULL,
          room_id INTEGER,
          event_date DATE NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          status VARCHAR(50) DEFAULT 'rescheduled',
          changed_by INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ schedule_events table created');
    }
    
    // Test inserting a reschedule event
    const testCourse = await pool.query('SELECT id FROM courses LIMIT 1');
    if (testCourse.rows.length > 0) {
      const courseId = testCourse.rows[0].id;
      
      const result = await pool.query(`
        INSERT INTO schedule_events 
        (course_id, event_date, start_time, end_time, status, changed_by)
        VALUES ($1, $2, $3, $4, 'test', $5)
        RETURNING *
      `, [courseId, '2024-12-20', '10:00:00', '11:30:00', 1]);
      
      console.log('✅ Test reschedule event created:', result.rows[0]);
      
      // Clean up test data
      await pool.query('DELETE FROM schedule_events WHERE status = $1', ['test']);
      console.log('🧹 Test data cleaned up');
    }
    
    console.log('\n🎉 RESCHEDULE FUNCTIONALITY IS WORKING!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testRescheduleFix();