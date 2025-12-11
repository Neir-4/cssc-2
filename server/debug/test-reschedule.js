import pool from '../config/database.js';

async function testReschedule() {
  try {
    console.log('=== TESTING RESCHEDULE FUNCTIONALITY ===\n');
    
    // Test rescheduling Pemrograman Website from Wed to Fri for current week
    const currentWeek = Math.ceil((new Date() - new Date('2024-08-26')) / (7 * 24 * 60 * 60 * 1000));
    console.log(`Current week: ${currentWeek}`);
    
    // Find Pemrograman Website course
    const course = await pool.query(`
      SELECT id, name FROM courses WHERE name = 'Pemrograman Website'
    `);
    
    if (course.rows.length === 0) {
      console.log('❌ Pemrograman Website course not found');
      return;
    }
    
    const courseId = course.rows[0].id;
    console.log(`📚 Found course: ${course.rows[0].name} (ID: ${courseId})`);
    
    // Check current schedule for this week
    console.log('\n📅 Current schedule for this week:');
    const currentSchedule = await pool.query(`
      SELECT se.*, c.name as course_name, r.name as room_name
      FROM schedule_events se
      JOIN courses c ON se.course_id = c.id
      LEFT JOIN rooms r ON se.room_id = r.id
      WHERE se.course_id = $1 AND se.academic_week = $2 AND se.status NOT IN ('cancelled', 'replaced')
      ORDER BY se.event_date
    `, [courseId, currentWeek]);
    
    currentSchedule.rows.forEach(event => {
      console.log(`  ${event.course_name}: ${event.event_date} ${event.start_time}-${event.end_time} at ${event.room_name || 'TBA'} (Status: ${event.status})`);
    });
    
    // Simulate reschedule to Friday
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Calculate Friday date for current week
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
      console.log('New event:', result.rows[0]);
      
      await client.query('COMMIT');
      
      // Verify the change
      console.log('\n🔍 Updated schedule for this week:');
      const updatedSchedule = await client.query(`
        SELECT se.*, c.name as course_name, r.name as room_name
        FROM schedule_events se
        JOIN courses c ON se.course_id = c.id
        LEFT JOIN rooms r ON se.room_id = r.id
        WHERE se.course_id = $1 AND se.academic_week = $2
        ORDER BY se.event_date, se.created_at DESC
      `, [courseId, currentWeek]);
      
      updatedSchedule.rows.forEach(event => {
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

testReschedule();