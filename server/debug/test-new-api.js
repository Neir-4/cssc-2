import pool from '../config/database.js';

async function testNewAPI() {
  try {
    console.log('🧪 Testing New API Compatibility...\n');
    
    // Test the query that the new API uses
    const query = `
      SELECT 
        cs.id,
        cs.start_time,
        cs.end_time,
        cs.week_sequence,
        cs.meeting_number,
        d.day_name,
        d.day_order,
        c.course_code,
        c.course_name,
        CONCAT(cl.room_number, ' (', b.building_code, ')') as room_name,
        cl.id as room_id,
        cl.capacity,
        STRING_AGG(l.full_name, ' & ' ORDER BY 
          CASE WHEN crl.role = 'Primary' THEN 1 
               WHEN crl.role = 'Assistant' THEN 2 
               ELSE 3 END) as lecturer_name
      FROM class_schedule cs
      JOIN days d ON cs.day_id = d.id
      JOIN classrooms cl ON cs.classroom_id = cl.id
      JOIN buildings b ON cl.building_id = b.id
      JOIN class_groups cg ON cs.class_group_id = cg.id
      JOIN courses c ON cg.course_id = c.id
      JOIN course_lecturers crl ON cs.id = crl.schedule_id
      JOIN lecturers l ON crl.lecturer_id = l.id
      WHERE cs.is_rescheduled = false
      AND d.day_order BETWEEN 1 AND 5
      GROUP BY cs.id, cs.start_time, cs.end_time, cs.week_sequence, cs.meeting_number,
               d.day_name, d.day_order, c.course_code, c.course_name, 
               cl.room_number, b.building_code, cl.id, cl.capacity
      ORDER BY d.day_order, cs.start_time
    `;

    const result = await pool.query(query);
    
    console.log(`📊 Found ${result.rows.length} schedule entries`);
    
    // Transform to match existing frontend format
    const eventsByDate = {};
    const today = new Date();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + mondayOffset);
    
    result.rows.forEach(row => {
      // Calculate actual date for this week
      const monday = new Date(startDate);
      const eventDate = new Date(monday);
      eventDate.setDate(monday.getDate() + (row.day_order - 1));
      const dateStr = eventDate.toISOString().split('T')[0];
      
      if (!eventsByDate[dateStr]) {
        eventsByDate[dateStr] = [];
      }
      
      eventsByDate[dateStr].push({
        id: row.id,
        course_id: row.id,
        course_code: row.course_code,
        course_name: row.course_name,
        lecturer_name: row.lecturer_name,
        komting_name: 'Komting',
        room: {
          id: row.room_id,
          name: row.room_name,
          capacity: row.capacity,
          floor: '1',
          building: 'Gedung D'
        },
        time: `${row.start_time.substring(0,5)} - ${row.end_time.substring(0,5)}`,
        start_time: row.start_time.substring(0,5),
        end_time: row.end_time.substring(0,5),
        status: 'scheduled',
        event_date: dateStr,
        meeting_number: row.meeting_number,
        week_sequence: row.week_sequence
      });
    });

    console.log('\n📅 Events by date:');
    Object.keys(eventsByDate).forEach(date => {
      console.log(`  ${date}:`);
      eventsByDate[date].forEach(event => {
        console.log(`    - ${event.course_name}: ${event.start_time}-${event.end_time} at ${event.room.name}`);
      });
    });
    
    console.log('\n✅ API Response Structure (compatible with frontend):');
    const apiResponse = {
      events: eventsByDate,
      date_range: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      total_events: result.rows.length
    };
    
    console.log(JSON.stringify(apiResponse, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testNewAPI();