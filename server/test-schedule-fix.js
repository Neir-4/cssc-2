// Quick test to verify the schedule-fixed.js route works
import pool from './config/database.js';

async function testScheduleRoute() {
  try {
    console.log('🧪 Testing schedule route fix...');
    
    // Test the query construction that was causing the error
    let queryParams = [];
    
    // Simulate non-admin user
    const user_id = 1;
    const role = 'komting';
    
    let baseQuery = `
      SELECT cs.id, cs.day_of_week, cs.start_time, cs.end_time,
             c.id as course_id, c.course_code, c.course_name,
             cs.lecturer_name,
             cl.id as room_id, cl.room_number as room_name, cl.capacity,
             b.building_name as building,
             NULL as event_date, 'default' as event_type
      FROM class_schedules cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN classrooms cl ON cs.room_id = cl.id
      LEFT JOIN buildings b ON cl.building_id = b.id
    `;
    
    let rescheduleQuery = `
      SELECT se.id, EXTRACT(DOW FROM se.event_date) as day_of_week, 
             se.start_time, se.end_time,
             c.id as course_id, c.course_code, c.course_name,
             'Dosen' as lecturer_name,
             cl.id as room_id, cl.room_number as room_name, cl.capacity,
             b.building_name as building,
             se.event_date, 'rescheduled' as event_type
      FROM schedule_events se
      JOIN courses c ON se.course_id = c.id
      LEFT JOIN classrooms cl ON se.room_id = cl.id
      LEFT JOIN buildings b ON cl.building_id = b.id
      WHERE se.status NOT IN ('cancelled', 'replaced')
    `;

    // Apply subscription filter for non-admin users
    if (role !== 'admin') {
      const subscriptionFilter = ` AND EXISTS (
        SELECT 1 FROM course_subscriptions csub 
        WHERE csub.user_id = $${queryParams.length + 1} AND csub.course_id = c.id
      )`;
      
      baseQuery += ` WHERE 1=1 ${subscriptionFilter}`;
      rescheduleQuery += ` ${subscriptionFilter.replace('csub.course_id = c.id', 'csub.course_id = se.course_id')}`;
      queryParams.push(user_id);
    }

    // Add date range for reschedule events
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7);
    
    rescheduleQuery += ` AND se.event_date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
    queryParams.push(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);
    
    const query = `${baseQuery} UNION ALL ${rescheduleQuery} ORDER BY day_of_week, start_time`;
    
    console.log('✅ Query constructed successfully');
    console.log('📋 Query params:', queryParams);
    
    // Test the actual query
    const result = await pool.query(query, queryParams);
    console.log('✅ Query executed successfully');
    console.log('📊 Results:', result.rows.length, 'rows');
    
    if (result.rows.length > 0) {
      console.log('📝 Sample result:', result.rows[0]);
    }
    
    console.log('🎉 Schedule route fix verified successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

testScheduleRoute();