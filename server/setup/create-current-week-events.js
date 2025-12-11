import pool from './config/database.js';

async function createCurrentWeekEvents() {
  try {
    const client = await pool.connect();
    
    // Get current week (December 8-12, 2025)
    const today = new Date();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    console.log('📅 Creating events for week starting:', monday.toISOString().split('T')[0]);
    
    // Get courses with their default schedules
    const courses = await client.query(`
      SELECT c.id, c.name, c.default_day, c.default_start_time, c.default_end_time, c.default_room_id
      FROM courses c
      WHERE c.is_active = true
    `);
    
    console.log('📚 Found courses:', courses.rows.length);
    
    // Create events for each course
    for (const course of courses.rows) {
      const eventDate = new Date(monday);
      eventDate.setDate(monday.getDate() + (course.default_day - 1)); // 1=Monday, 2=Tuesday, etc.
      
      const eventDateStr = eventDate.toISOString().split('T')[0];
      
      // Check if event already exists
      const existingEvent = await client.query(`
        SELECT id FROM schedule_events 
        WHERE course_id = $1 AND event_date = $2
      `, [course.id, eventDateStr]);
      
      if (existingEvent.rows.length === 0) {
        // Create new event
        await client.query(`
          INSERT INTO schedule_events (course_id, room_id, event_date, start_time, end_time, status)
          VALUES ($1, $2, $3, $4, $5, 'default')
        `, [
          course.id,
          course.default_room_id,
          eventDateStr,
          course.default_start_time,
          course.default_end_time
        ]);
        
        console.log(`✅ Created event: ${course.name} on ${eventDateStr} ${course.default_start_time}-${course.default_end_time}`);
      } else {
        console.log(`⚠️ Event already exists: ${course.name} on ${eventDateStr}`);
      }
    }
    
    // Verify events were created
    const newEvents = await client.query(`
      SELECT se.*, c.name as course_name, r.name as room_name
      FROM schedule_events se
      JOIN courses c ON se.course_id = c.id
      JOIN rooms r ON se.room_id = r.id
      WHERE se.event_date BETWEEN $1 AND $2
      ORDER BY se.event_date, se.start_time
    `, [monday.toISOString().split('T')[0], new Date(monday.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]);
    
    console.log('📅 Events for current week after creation:', newEvents.rows.length);
    newEvents.rows.forEach(event => {
      console.log(`  ${event.event_date} ${event.start_time}-${event.end_time}: ${event.course_name} (${event.room_name})`);
    });
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

createCurrentWeekEvents();