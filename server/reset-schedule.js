import pool from './config/database.js';

async function resetSchedule() {
  try {
    console.log('🗑️ Clearing all reschedule events...');
    const result = await pool.query('DELETE FROM schedule_events');
    console.log(`✅ Deleted ${result.rowCount} reschedule events`);
    
    console.log('📅 Original schedules will now be used');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetSchedule();