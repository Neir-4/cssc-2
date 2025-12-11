import pool from './config/database.js';

async function checkDate() {
  try {
    const result = await pool.query(`
      SELECT event_date, 
             EXTRACT(DOW FROM event_date) as day_of_week, 
             course_id,
             c.course_name
      FROM schedule_events se
      JOIN courses c ON se.course_id = c.id
      WHERE course_id = 2
    `);
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      console.log('Basis Data event_date:', row.event_date);
      console.log('Day of week (0=Sunday, 4=Thursday):', row.day_of_week);
      
      const date = new Date(row.event_date);
      console.log('Actual date:', date.toLocaleDateString('id-ID', {
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      }));
      
      // Check what day December 10, 2025 actually is
      const dec10 = new Date('2025-12-10');
      console.log('December 10, 2025 is:', dec10.toLocaleDateString('id-ID', {weekday: 'long'}));
      
      // Check what day December 11, 2025 actually is  
      const dec11 = new Date('2025-12-11');
      console.log('December 11, 2025 is:', dec11.toLocaleDateString('id-ID', {weekday: 'long'}));
    } else {
      console.log('No rescheduled events found for Basis Data');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDate();