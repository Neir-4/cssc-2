import pool from '../config/database.js';

async function testCurrentWeekReschedule() {
  try {
    console.log('=== TESTING CURRENT WEEK RESCHEDULE ===\n');
    
    const currentWeek = 16; // Current week
    const courseId = 1; // Pemrograman Website
    
    console.log(`📚 Rescheduling Pemrograman Website for week ${currentWeek}`);
    
    // Show current schedule
    console.log('\n📅 BEFORE reschedule:');
    const beforeSchedule = await pool.query(`
      SELECT se.*, c.name as course_name, r.name as room_name
      FROM schedule_events se
      JOIN courses c ON se.course_id = c.id
      LEFT JOIN rooms r ON se.room_id = r.id
      WHERE se.course_id = $1 AND se.academic_week = $2
      ORDER BY se.created_at DESC
    `, [courseId, currentWeek]);
    
    beforeSchedule.rows.forEach(event => {
      console.log(`  ${event.course_name}: ${event.event_date} ${event.start_time}-${event.end_time} at ${event.room_name || 'TBA'} (Status: ${event.status})`);
    });
    
    // Perform reschedule from Wednesday to Friday
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Calculate Friday date for week 16
      const semesterStart = new Date('2024-08-26');
      const weekStart = new Date(semesterStart);
      weekStart.setDate(semesterStart.getDate() + (currentWeek - 1) * 7);
      const fridayDate = new Date(weekStart);
      fridayDate.setDate(weekStart.getDate() + 4); // Friday is 4 days after Monday
      
      const newDate = fridayDate.toISOString().split('T')[0];
      const newStartTime = '08:00:00';
      const newEndTime = '10:30:00';
      const roomId = 11; // D-105
      
      console.log(`\n🔄 Rescheduling to: ${newDate} ${newStartTime}-${newEndTime} at room ${roomId}`);
      
      // Mark existing event as replaced
      await client.query(
        `UPDATE schedule_events SET status = 'replaced' 
         WHERE course_id = $1 AND academic_week = $2 AND status NOT IN ('cancelled', 'replaced')`,
        [courseId, currentWeek]
      );

      // Create new schedule event
      const result = await client.query(
        `INSERT INTO schedule_events 
         (course_id, room_id, event_date, start_time, end_time, status, changed_by, academic_week, meeting_number)
         VALUES ($1, $2, $3, $4, $5, 'update', $6, $7, $8)
         RETURNING *`,
        [courseId, roomId, newDate, newStartTime, newEndTime, 8, currentWeek, currentWeek] // user_id = 8 (Alya)
      );
      
      console.log('✅ Reschedule successful!');
      
      await client.query('COMMIT');
      
      // Show updated schedule
      console.log('\n📅 AFTER reschedule:');
      const afterSchedule = await client.query(`
        SELECT se.*, c.name as course_name, r.name as room_name
        FROM schedule_events se
        JOIN courses c ON se.course_id = c.id
        LEFT JOIN rooms r ON se.room_id = r.id
        WHERE se.course_id = $1 AND se.academic_week = $2
        ORDER BY se.created_at DESC
      `, [courseId, currentWeek]);
      
      afterSchedule.rows.forEach(event => {
        console.log(`  ${event.course_name}: ${event.event_date} ${event.start_time}-${event.end_time} at ${event.room_name || 'TBA'} (Status: ${event.status})`);
      });
      
      // Test what API would return for this week
      console.log('\n🔍 API RESPONSE for current week:');
      const monday = new Date('2024-12-09');
      const friday = new Date('2024-12-13');
      
      const apiResult = await client.query(`
        SELECT se.id, se.event_date, se.start_time, se.end_time, se.status,
               c.id as course_id, c.course_code, c.name as course_name,
               r.id as room_id, r.name as room_name
        FROM schedule_events se
        JOIN courses c ON se.course_id = c.id
        LEFT JOIN rooms r ON se.room_id = r.id
        WHERE se.event_date BETWEEN $1 AND $2
        AND c.is_active = true
        AND se.status NOT IN ('cancelled', 'replaced')
        ORDER BY se.event_date, se.start_time
      `, [monday.toISOString().split('T')[0], friday.toISOString().split('T')[0]]);
      
      console.log(`📊 API returns ${apiResult.rows.length} events:`);
      apiResult.rows.forEach(event => {
        console.log(`  ${event.course_name}: ${event.event_date} ${event.start_time}-${event.end_time} at ${event.room_name || 'TBA'} (Status: ${event.status})`);
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testCurrentWeekReschedule();