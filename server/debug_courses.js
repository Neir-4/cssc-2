import pool from './config/database.js';

console.log('🔍 Debug course names alignment...\n');

try {
  // Get all courses from database
  const coursesResult = await pool.query('SELECT id, name, course_code FROM courses ORDER BY name');
  
  console.log('📚 Courses in database:');
  coursesResult.rows.forEach((course, idx) => {
    console.log(`${idx + 1}. "${course.name}" (${course.course_code})`);
  });

  // Get user subscriptions
  console.log('\n📋 Yehezkiel subscriptions:');
  const subsResult = await pool.query(`
    SELECT c.id, c.name, c.course_code
    FROM course_subscriptions cs
    JOIN courses c ON cs.course_id = c.id
    WHERE cs.user_id = (SELECT id FROM users WHERE email = 'yehezkiel@usu.ac.id')
    ORDER BY c.name
  `);

  if (subsResult.rows.length === 0) {
    console.log('❌ No subscriptions found');
  } else {
    subsResult.rows.forEach((course, idx) => {
      console.log(`${idx + 1}. "${course.name}" (${course.course_code})`);
    });
  }

  // Compare with materials in frontend
  console.log('\n🎨 Materials in frontend (hardcoded):');
  const frontendMaterials = [
    "Pemrograman Website",
    "Struktur Data",
    "Basis Data",
    "Wirausaha Digital",
    "Kecerdasan Buatan",
    "Komputasi Awan",
    "Praktikum Pemrog. Website",
    "Praktikum Struktur Data",
    "Praktikum Basis Data"
  ];

  frontendMaterials.forEach((mat, idx) => {
    console.log(`${idx + 1}. "${mat}"`);
  });

  // Check for mismatches
  console.log('\n⚠️  Checking for name mismatches:');
  let hasMismatch = false;
  coursesResult.rows.forEach(course => {
    const found = frontendMaterials.some(mat => mat.toLowerCase() === course.name.toLowerCase());
    if (!found) {
      console.log(`❌ Database: "${course.name}" NOT found in frontend materials`);
      hasMismatch = true;
    }
  });

  if (!hasMismatch) {
    console.log('✅ All database courses match frontend materials!');
  }

} catch (error) {
  console.log('❌ Error:', error.message);
}
