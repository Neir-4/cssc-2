import pool from '../config/database.js';

async function testScheduleAPI() {
  try {
    const client = await pool.connect();
    
    // Simulate the API call for current week
    const today = new Date();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + mondayOffset);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    console.log('📅 Testing API for date range:');
    console.log('  Start:', startDate.toISOString().split('T')[0]);
    console.log('  End:', endDate.toISOString().split('T')[0]);
    
    // Test for admin user (should see all courses)
    const adminQuery = `
      SELECT se.id, se.event_date, se.start_time, se.end_time, se.status, se.change_reason,
             se.created_at as event_created_at,
             c.id as course_id, c.course_code, c.name as course_name,
             l.name as lecturer_name, k.name as komting_name,
             r.id as room_id, r.name as room_name, r.capacity, r.floor, r.building,
             u.name as changed_by_name
      FROM schedule_events se
      JOIN courses c ON se.course_id = c.id
      LEFT JOIN users l ON c.lecturer_id = l.id
      LEFT JOIN users k ON c.komting_id = k.id
      LEFT JOIN rooms r ON se.room_id = r.id
      LEFT JOIN users u ON se.changed_by = u.id
      WHERE se.event_date BETWEEN $1 AND $2
      AND c.is_active = true
      AND se.status NOT IN ('cancelled', 'replaced')
      ORDER BY se.event_date, se.start_time
    `;
    
    const result = await client.query(adminQuery, [
      startDate.toISOString().split('T')[0], 
      endDate.toISOString().split('T')[0]
    ]);
    
    console.log('\n📊 API would return:', result.rows.length, 'events');
    
    // Group events by date (like the API does)
    const eventsByDate = {};
    result.rows.forEach(event => {
      const date = event.event_date;
      if (!eventsByDate[date]) {
        eventsByDate[date] = [];
      }
      eventsByDate[date].push({
        id: event.id,
        course_id: event.course_id,
        course_code: event.course_code,
        course_name: event.course_name,
        lecturer_name: event.lecturer_name,
        komting_name: event.komting_name,
        room: {
          id: event.room_id,
          name: event.room_name,
          capacity: event.capacity,
          floor: event.floor,
          building: event.building
        },
        time: `${event.start_time} - ${event.end_time}`,
        start_time: event.start_time,
        end_time: event.end_time,
        status: event.status
      });
    });
    
    console.log('\n📅 Events by date:');
    Object.keys(eventsByDate).forEach(date => {
      console.log(`  ${date}:`);
      eventsByDate[date].forEach(event => {
        console.log(`    - ${event.course_name}: ${event.start_time}-${event.end_time} at ${event.room.name}`);
      });
    });
    
    console.log('\n✅ API Response Structure:');
    console.log({
      events: eventsByDate,
      date_range: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      },
      total_events: result.rows.length
    });
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testScheduleAPI();