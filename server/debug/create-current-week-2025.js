import pool from '../config/database.js';

async function createCurrentWeekEvents() {
  try {
    const client = await pool.connect();
    
    // Current week: December 8-12, 2025
    const monday = new Date('2025-12-08');
    const friday = new Date('2025-12-12');
    
    console.log('📅 Creating events for week:', monday.toISOString().split('T')[0], 'to', friday.toISOString().split('T')[0]);
    
    // Get all active courses
    const courses = await client.query(`
      SELECT id, name, default_day, default_start_time, default_end_time, default_room_id
      FROM courses 
      WHERE is_active = true
    `);
    
    console.log('📚 Found courses:', courses.rows.length);
    
    // Clear existing events for this week to avoid duplicates
    await client.query(`
      DELETE FROM schedule_events 
      WHERE event_date BETWEEN $1 AND $2
    `, [monday.toISOString().split('T')[0], friday.toISOString().split('T')[0]]);
    
    // Create events for each course
    for (const course of courses.rows) {
      // Calculate the date for this course in this week
      const eventDate = new Date(monday);
      eventDate.setDate(monday.getDate() + (course.default_day - 1)); // 1=Monday, 2=Tuesday, etc.
      
      // Only create if it's within the week (Monday-Friday)
      if (course.default_day >= 1 && course.default_day <= 5) {
        const eventDateStr = eventDate.toISOString().split('T')[0];
        
        // Calculate academic week (assuming semester started Aug 26, 2024)
        const semesterStart = new Date('2024-08-26');
        const academicWeek = Math.ceil((eventDate - semesterStart) / (7 * 24 * 60 * 60 * 1000));
        
        await client.query(`
          INSERT INTO schedule_events 
          (course_id, room_id, event_date, start_time, end_time, status, academic_week, meeting_number)
          VALUES ($1, $2, $3, $4, $5, 'scheduled', $6, $7)
        `, [
          course.id,
          course.default_room_id,
          eventDateStr,
          course.default_start_time,
          course.default_end_time,
          academicWeek,
          academicWeek // Using academic week as meeting number for now
        ]);
        
        console.log(`✅ Created: ${course.name} on ${eventDateStr} ${course.default_start_time}-${course.default_end_time}`);
      }
    }
    
    // Verify created events
    const verifyEvents = await client.query(`
      SELECT se.*, c.name as course_name, r.name as room_name
      FROM schedule_events se
      JOIN courses c ON se.course_id = c.id
      JOIN rooms r ON se.room_id = r.id
      WHERE se.event_date BETWEEN $1 AND $2
      ORDER BY se.event_date, se.start_time
    `, [monday.toISOString().split('T')[0], friday.toISOString().split('T')[0]]);
    
    console.log('\n📊 Created events:', verifyEvents.rows.length);
    verifyEvents.rows.forEach(event => {
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