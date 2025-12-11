import pool from '../config/database.js';

async function checkCurrentWeek() {
  try {
    const client = await pool.connect();
    
    // Get current date
    const today = new Date();
    console.log('📅 Today:', today.toISOString().split('T')[0]);
    
    // Calculate current week (Monday to Friday)
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    
    console.log('📅 Current week range:');
    console.log('  Monday:', monday.toISOString().split('T')[0]);
    console.log('  Friday:', friday.toISOString().split('T')[0]);
    
    // Check schedule events for current week
    const currentWeekEvents = await client.query(`
      SELECT se.*, c.name as course_name, r.name as room_name
      FROM schedule_events se
      JOIN courses c ON se.course_id = c.id
      JOIN rooms r ON se.room_id = r.id
      WHERE se.event_date BETWEEN $1 AND $2
      ORDER BY se.event_date, se.start_time
    `, [monday.toISOString().split('T')[0], friday.toISOString().split('T')[0]]);
    
    console.log('📅 Events for current week:', currentWeekEvents.rows.length);
    currentWeekEvents.rows.forEach(event => {
      console.log(`  ${event.event_date} ${event.start_time}-${event.end_time}: ${event.course_name} (${event.room_name})`);
    });
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkCurrentWeek();