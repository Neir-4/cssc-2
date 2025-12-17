import pool from "../config/database.js";

async function testCompleteFlow() {
  try {
    console.log("=== Testing Complete Material Upload/Retrieval Flow ===\n");

    // 1. Check latest materials
    console.log("1. Checking latest materials in database:");
    const materialsResult = await pool.query(`
      SELECT m.id, m.course_id, m.meeting_number, m.title, m.file_name, u.name as uploaded_by
      FROM materials m
      LEFT JOIN users u ON m.uploaded_by = u.id
      ORDER BY m.created_at DESC
      LIMIT 5
    `);

    console.log(`Total materials: ${materialsResult.rows.length}`);
    materialsResult.rows.forEach((m, i) => {
      console.log(
        `\n  ${i + 1}. [ID: ${m.id}] Course: ${m.course_id}, Meeting: ${
          m.meeting_number
        }`
      );
      console.log(`     Title: ${m.title}`);
      console.log(`     File: ${m.file_name}`);
      console.log(`     By: ${m.uploaded_by}`);
    });

    // 2. Test specific course query
    console.log("\n2. Testing query with specific course and meeting:");
    const testResult = await pool.query(
      `
      SELECT m.id, m.course_id, m.meeting_number, m.title, m.file_name
      FROM materials m
      WHERE m.course_id = $1 AND m.meeting_number = $2
      ORDER BY m.created_at DESC
    `,
      [24, 1]
    );

    console.log(
      `Found ${testResult.rows.length} materials for course 24, meeting 1:`
    );
    testResult.rows.forEach((m, i) => {
      console.log(`  ${i + 1}. [${m.id}] ${m.title}`);
    });

    // 3. Test with LEFT JOIN (like in the actual endpoint)
    console.log("\n3. Testing with LEFT JOIN (production query):");
    const prodResult = await pool.query(
      `
      SELECT m.*, u.name as uploader_name
      FROM materials m
      LEFT JOIN users u ON m.uploaded_by = u.id
      WHERE m.course_id = $1 AND m.meeting_number = $2
      ORDER BY m.created_at DESC
    `,
      [24, 1]
    );

    console.log(
      `Found ${prodResult.rows.length} materials with uploader info:`
    );
    prodResult.rows.forEach((m, i) => {
      console.log(
        `  ${i + 1}. Title: ${m.title}, Uploader: ${
          m.uploader_name || "Unknown"
        }, Size: ${m.file_size}`
      );
    });

    console.log("\n✅ All tests completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

testCompleteFlow();
