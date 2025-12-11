import pool from './config/database.js';

async function fixScheduleDates() {
  try {
    console.log('🔧 Fixing schedule dates to current week (December 2024)...\n');
    
    // Clear existing events
    await pool.query('DELETE FROM schedule_events');
    console.log('✅ Cleared existing schedule events');
    
    // Create events for current week (December 9-13, 2024)
    const currentWeekEvents = [
      // Monday Dec 9 - no classes
      
      // Tuesday Dec 10 - Kecerdasan Buatan
      { course_id: 4, date: '2024-12-10', day: 2 },
      
      // Wednesday Dec 11 - Pemrograman Website, Basis Data  
      { course_id: 1, date: '2024-12-11', day: 3 },
      { course_id: 2, date: '2024-12-11', day: 3 },
      
      // Thursday Dec 12 - Etika Profesi, Wirausaha Digital
      { course_id: 5, date: '2024-12-12', day: 4 },
      { course_id: 6, date: '2024-12-12', day: 4 },
      
      // Friday Dec 13 - Struktur Data
      { course_id: 3, date: '2024-12-13', day: 5 }
    ];
    
    for (const event of currentWeekEvents) {
      // Get course details
      const courseResult = await pool.query(
        'SELECT * FROM courses WHERE id = $1',
        [event.course_id]
      );
      
      if (courseResult.rows.length > 0) {
        const course = courseResult.rows[0];
        
        await pool.query(`
          INSERT INTO schedule_events 
          (course_id, room_id, event_date, start_time, end_time, status, academic_week, meeting_number, created_at)
          VALUES ($1, $2, $3, $4, $5, 'scheduled', 68, 1, NOW())
        `, [
          course.id,
          course.default_room_id,
          event.date,
          course.default_start_time,
          course.default_end_time
        ]);
        
        console.log(`✅ Created event: ${course.name} on ${event.date} ${course.default_start_time}-${course.default_end_time}`);
      }
    }
    
    // Also create events for next week (December 16-20, 2024)
    const nextWeekEvents = [
      // Monday Dec 16 - no classes
      
      // Tuesday Dec 17 - Kecerdasan Buatan
      { course_id: 4, date: '2024-12-17', day: 2 },
      
      // Wednesday Dec 18 - Pemrograman Website, Basis Data  
      { course_id: 1, date: '2024-12-18', day: 3 },
      { course_id: 2, date: '2024-12-18', day: 3 },
      
      // Thursday Dec 19 - Etika Profesi, Wirausaha Digital
      { course_id: 5, date: '2024-12-19', day: 4 },
      { course_id: 6, date: '2024-12-19', day: 4 },
      
      // Friday Dec 20 - Struktur Data
      { course_id: 3, date: '2024-12-20', day: 5 }
    ];
    
    for (const event of nextWeekEvents) {
      // Get course details
      const courseResult = await pool.query(
        'SELECT * FROM courses WHERE id = $1',
        [event.course_id]
      );
      
      if (courseResult.rows.length > 0) {
        const course = courseResult.rows[0];
        
        await pool.query(`
          INSERT INTO schedule_events 
          (course_id, room_id, event_date, start_time, end_time, status, academic_week, meeting_number, created_at)
          VALUES ($1, $2, $3, $4, $5, 'scheduled', 69, 2, NOW())
        `, [
          course.id,
          course.default_room_id,
          event.date,
          course.default_start_time,
          course.default_end_time
        ]);
        
        console.log(`✅ Created event: ${course.name} on ${event.date} ${course.default_start_time}-${course.default_end_time}`);
      }
    }
    
    // Check final count
    const finalCount = await pool.query('SELECT COUNT(*) FROM schedule_events');
    console.log(`\n🎉 Successfully created ${finalCount.rows[0].count} schedule events for December 2024`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixScheduleDates();