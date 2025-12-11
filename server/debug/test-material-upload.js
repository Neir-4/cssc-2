import pool from "../config/database.js";

async function testMaterialTable() {
  try {
    console.log("=== Testing Materials Table ===\n");

    // Check if table exists and has data
    const result = await pool.query(`
      SELECT m.id, m.course_id, m.meeting_number, m.title, m.uploaded_by, m.created_at
      FROM materials m
      ORDER BY m.created_at DESC
      LIMIT 10
    `);

    console.log(`Total materials: ${result.rows.length}\n`);

    if (result.rows.length > 0) {
      console.log("Latest materials:");
      result.rows.forEach((m, i) => {
        console.log(`\n${i + 1}. ID: ${m.id}`);
        console.log(`   Course ID: ${m.course_id}`);
        console.log(`   Meeting: ${m.meeting_number}`);
        console.log(`   Title: ${m.title}`);
        console.log(`   Uploaded By: ${m.uploaded_by}`);
        console.log(`   Created: ${m.created_at}`);
      });
    } else {
      console.log("No materials found in database.");
    }

    // Check courses table
    console.log("\n=== Checking Courses ===\n");
    const coursesResult = await pool.query(`
      SELECT id, name, course_code FROM courses LIMIT 5
    `);

    console.log(`Total courses: ${coursesResult.rows.length}`);
    coursesResult.rows.forEach((c) => {
      console.log(`- ${c.id}: ${c.name} (${c.course_code})`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

testMaterialTable();
