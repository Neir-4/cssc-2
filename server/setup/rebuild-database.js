import fs from 'fs';
import path from 'path';
import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

async function rebuildDatabase() {
  try {
    console.log('🔄 Starting database rebuild...\n');
    
    // Step 1: Drop and recreate schema
    console.log('1️⃣ Dropping old tables and creating new schema...');
    const schemaSQL = fs.readFileSync(path.join(process.cwd(), 'migrations', '000_drop_and_recreate_database.sql'), 'utf8');
    await pool.query(schemaSQL);
    console.log('✅ New schema created');
    
    // Step 2: Insert master data
    console.log('\n2️⃣ Inserting master data...');
    const masterDataSQL = fs.readFileSync(path.join(process.cwd(), 'migrations', '001_insert_master_data.sql'), 'utf8');
    await pool.query(masterDataSQL);
    console.log('✅ Master data inserted');
    
    // Step 3: Insert schedule data
    console.log('\n3️⃣ Inserting schedule data...');
    const scheduleDataSQL = fs.readFileSync(path.join(process.cwd(), 'migrations', '002_insert_schedule_data.sql'), 'utf8');
    await pool.query(scheduleDataSQL);
    console.log('✅ Schedule data inserted');
    
    // Step 4: Update user passwords
    console.log('\n4️⃣ Setting up user passwords...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.query('UPDATE users SET password_hash = $1', [hashedPassword]);
    console.log('✅ All user passwords set to: admin123');
    
    // Step 5: Verify data
    console.log('\n5️⃣ Verifying database...');
    
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const courseCount = await pool.query('SELECT COUNT(*) FROM courses');
    const scheduleCount = await pool.query('SELECT COUNT(*) FROM class_schedule');
    const lecturerCount = await pool.query('SELECT COUNT(*) FROM lecturers');
    
    console.log(`👥 Users: ${userCount.rows[0].count}`);
    console.log(`📚 Courses: ${courseCount.rows[0].count}`);
    console.log(`📅 Schedules: ${scheduleCount.rows[0].count}`);
    console.log(`👨‍🏫 Lecturers: ${lecturerCount.rows[0].count}`);
    
    // Step 6: Show sample schedule
    console.log('\n📋 Sample schedule:');
    const sampleSchedule = await pool.query(`
      SELECT 
        d.day_name,
        cs.start_time,
        cs.end_time,
        c.course_name,
        CONCAT(cl.room_number, ' (', b.building_code, ')') as room,
        STRING_AGG(l.full_name, ' & ') as lecturers
      FROM class_schedule cs
      JOIN days d ON cs.day_id = d.id
      JOIN classrooms cl ON cs.classroom_id = cl.id
      JOIN buildings b ON cl.building_id = b.id
      JOIN class_groups cg ON cs.class_group_id = cg.id
      JOIN courses c ON cg.course_id = c.id
      JOIN course_lecturers crl ON cs.id = crl.schedule_id
      JOIN lecturers l ON crl.lecturer_id = l.id
      GROUP BY d.day_name, d.day_order, cs.start_time, cs.end_time, c.course_name, cl.room_number, b.building_code
      ORDER BY d.day_order, cs.start_time
    `);
    
    sampleSchedule.rows.forEach(row => {
      console.log(`  ${row.day_name} ${row.start_time}-${row.end_time}: ${row.course_name} @ ${row.room}`);
    });
    
    console.log('\n🎉 Database rebuild completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update server.js to use new schedule route');
    console.log('2. Test the frontend with new API');
    console.log('3. All users can login with password: admin123');
    
  } catch (error) {
    console.error('❌ Database rebuild failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

rebuildDatabase();