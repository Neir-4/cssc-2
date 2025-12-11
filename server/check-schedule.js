import pool from './config/database.js';

async function checkSchedule() {
  try {
    console.log('=== SCHEDULE EVENTS (Basis Data) ===');
    const events = await pool.query(`
      SELECT se.*, c.course_name 
      FROM schedule_events se 
      JOIN courses c ON se.course_id = c.id 
      WHERE c.course_name = 'Basis Data' 
      ORDER BY se.created_at DESC
    `);
    console.table(events.rows);
    
    console.log('=== CLASS SCHEDULES (Basis Data) ===');
    const schedules = await pool.query(`
      SELECT cs.*, c.course_name 
      FROM class_schedules cs 
      JOIN courses c ON cs.course_id = c.id 
      WHERE c.course_name = 'Basis Data'
    `);
    console.table(schedules.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSchedule();