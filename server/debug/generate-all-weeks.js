import pool from '../config/database.js';

async function generateAllWeeks() {
  try {
    console.log('=== GENERATING SCHEDULE FOR ALL WEEKS ===\n');
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Clear existing schedule events
      console.log('🧹 Clearing existing schedule events...');
      await client.query('DELETE FROM schedule_events');
      
      // Get all active courses
      const courses = await client.query(`
        SELECT id, name, default_day, default_start_time, default_end_time, default_room_id
        FROM courses 
        WHERE is_active = true
      `);
      
      console.log(`📚 Found ${courses.rows.length} active courses`);
      
      // Generate events for 16 weeks (full semester)
      const semesterStart = new Date('2024-08-26'); // Monday of first week
      const totalWeeks = 16;
      
      console.log('📅 Generating events for all weeks...');
      
      for (let week = 1; week <= totalWeeks; week++) {
        console.log(`  Week ${week}:`);
        
        for (const course of courses.rows) {
          // Calculate the date for this course in this week
          const weekStart = new Date(semesterStart);
          weekStart.setDate(semesterStart.getDate() + (week - 1) * 7);
          
          // Get the specific day for this course (1=Monday, 2=Tuesday, etc.)
          const courseDate = new Date(weekStart);
          courseDate.setDate(weekStart.getDate() + (course.default_day - 1));
          
          const eventDate = courseDate.toISOString().split('T')[0];
          
          // Insert schedule event
          await client.query(`
            INSERT INTO schedule_events 
            (course_id, room_id, event_date, start_time, end_time, status, academic_week, meeting_number)
            VALUES ($1, $2, $3, $4, $5, 'scheduled', $6, $7)
          `, [
            course.id,
            course.default_room_id,
            eventDate,
            course.default_start_time,
            course.default_end_time,
            week,
            week // meeting_number same as week for now
          ]);
          
          console.log(`    ✅ ${course.name} - ${eventDate} ${course.default_start_time}-${course.default_end_time}`);
        }
      }
      
      await client.query('COMMIT');
      console.log('\n✅ All weeks generated successfully!');
      
      // Verify the generation
      const verification = await client.query(`
        SELECT 
          academic_week,
          COUNT(*) as events_count,
          MIN(event_date) as week_start,
          MAX(event_date) as week_end
        FROM schedule_events 
        WHERE status = 'scheduled'
        GROUP BY academic_week 
        ORDER BY academic_week
      `);
      
      console.log('\n🔍 VERIFICATION:');
      verification.rows.forEach(week => {
        console.log(`  Week ${week.academic_week}: ${week.events_count} events (${week.week_start} to ${week.week_end})`);
      });
      
      const totalEvents = await client.query('SELECT COUNT(*) as total FROM schedule_events');
      console.log(`\nTotal events created: ${totalEvents.rows[0].total}`);
      
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

generateAllWeeks();