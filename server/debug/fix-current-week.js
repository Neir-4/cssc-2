import pool from '../config/database.js';

async function fixCurrentWeek() {
  try {
    console.log('=== FIXING CURRENT WEEK DISPLAY ===\n');
    
    // Current date is December 11, 2024
    // Week 16 should be December 9-13, 2024
    const currentDate = new Date('2024-12-11');
    const semesterStart = new Date('2024-08-26'); // Monday of first week
    
    // Calculate correct current week
    const weeksDiff = Math.floor((currentDate - semesterStart) / (7 * 24 * 60 * 60 * 1000));
    const currentWeek = weeksDiff + 1;
    
    console.log(`📅 Current date: ${currentDate.toDateString()}`);
    console.log(`📅 Semester start: ${semesterStart.toDateString()}`);
    console.log(`📅 Calculated current week: ${currentWeek}`);
    
    // Check what events exist for current week (week 16)
    const currentWeekEvents = await pool.query(`
      SELECT se.*, c.name as course_name, r.name as room_name
      FROM schedule_events se
      JOIN courses c ON se.course_id = c.id
      LEFT JOIN rooms r ON se.room_id = r.id
      WHERE se.academic_week = $1 AND se.status NOT IN ('cancelled', 'replaced')
      ORDER BY se.event_date, se.start_time
    `, [16]);
    
    console.log(`\n📊 Events for week 16 (current week):`);
    if (currentWeekEvents.rows.length === 0) {
      console.log('  ❌ No events found for current week!');
    } else {
      currentWeekEvents.rows.forEach(event => {
        console.log(`  ${event.course_name}: ${event.event_date} ${event.start_time}-${event.end_time} at ${event.room_name || 'TBA'} (Status: ${event.status})`);
      });
    }
    
    // Check what the API would return for this week
    const monday = new Date('2024-12-09'); // Monday of week 16
    const friday = new Date('2024-12-13'); // Friday of week 16
    
    console.log(`\n🔍 API query for ${monday.toISOString().split('T')[0]} to ${friday.toISOString().split('T')[0]}:`);
    
    const apiResult = await pool.query(`
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
    `, [monday.toISOString().split('T')[0], friday.toISOString().split('T')[0]]);
    
    console.log(`📊 API would return ${apiResult.rows.length} events:`);
    apiResult.rows.forEach(event => {
      console.log(`  ${event.course_name}: ${event.event_date} ${event.start_time}-${event.end_time} at ${event.room_name || 'TBA'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

fixCurrentWeek();