import pool from './config/database.js';

async function fixConstraints() {
  try {
    console.log('🔧 Fixing database constraints...');
    
    // Fix status constraint
    await pool.query(`
      ALTER TABLE schedule_events DROP CONSTRAINT IF EXISTS schedule_events_status_check;
    `);
    
    await pool.query(`
      ALTER TABLE schedule_events ADD CONSTRAINT schedule_events_status_check 
      CHECK (status IN ('scheduled', 'cancelled', 'update', 'replaced', 'changed', 'default'));
    `);
    
    console.log('✅ Status constraint fixed');
    
    // Check current schedule data
    const result = await pool.query(`
      SELECT COUNT(*) as total, status, 
             MIN(event_date) as earliest, MAX(event_date) as latest
      FROM schedule_events 
      GROUP BY status
    `);
    
    console.log('📊 Current schedule events:');
    result.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.total} events (${row.earliest} to ${row.latest})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixConstraints();