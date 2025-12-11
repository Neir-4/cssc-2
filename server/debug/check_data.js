import pool from '../config/database.js';

async function checkData() {
  try {
    console.log('=== CHECKING DATABASE DATA ===\n');
    
    // Check courses
    const courses = await pool.query(`
      SELECT id, name, default_day, default_start_time, default_end_time, default_room_id, is_active 
      FROM courses 
      ORDER BY id
    `);
    console.log('📚 COURSES:');
    courses.rows.forEach(course => {
      console.log(`  ${course.id}: ${course.name} - Day ${course.default_day}, ${course.default_start_time}-${course.default_end_time}, Room ${course.default_room_id}, Active: ${course.is_active}`);
    });
    
    // Check rooms
    const rooms = await pool.query('SELECT id, name FROM rooms ORDER BY id');
    console.log('\n🏢 ROOMS:');
    rooms.rows.forEach(room => {
      console.log(`  ${room.id}: ${room.name}`);
    });
    
    // Check schedule events
    const events = await pool.query(`
      SELECT se.*, c.name as course_name, r.name as room_name 
      FROM schedule_events se
      JOIN courses c ON se.course_id = c.id
      LEFT JOIN rooms r ON se.room_id = r.id
      ORDER BY se.event_date, se.start_time
    `);
    console.log('\n📅 SCHEDULE EVENTS:');
    if (events.rows.length === 0) {
      console.log('  No schedule events found!');
    } else {
      events.rows.forEach(event => {
        console.log(`  ${event.course_name}: ${event.event_date} ${event.start_time}-${event.end_time} at ${event.room_name || 'No Room'} (Week ${event.academic_week})`);
      });
    }
    
    console.log(`\nTotal: ${courses.rows.length} courses, ${rooms.rows.length} rooms, ${events.rows.length} events`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkData();