import pool from './config/database.js';

async function checkOriginalSchedule() {
  try {
    console.log('=== CLASS SCHEDULES (Original) ===');
    const schedules = await pool.query(`
      SELECT cs.*, c.course_name 
      FROM class_schedules cs 
      JOIN courses c ON cs.course_id = c.id 
      ORDER BY c.course_name
    `);
    console.table(schedules.rows);
    
    console.log('=== SCHEDULE EVENTS (All Reschedules) ===');
    const events = await pool.query(`
      SELECT se.*, c.course_name 
      FROM schedule_events se 
      JOIN courses c ON se.course_id = c.id 
      ORDER BY se.created_at DESC
    `);
    console.table(events.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkOriginalSchedule();