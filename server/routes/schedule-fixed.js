import express from "express";
import pool from "../config/database.js";
import { authenticate, requireAdminOrKomting } from "../middleware/index.js";

const router = express.Router();

// Get real schedule with proper subscription filtering
router.get("/real", authenticate, async (req, res) => {
  try {
    const user_id = req.user.id;

    console.log("🔍 Schedule request:", { user_id, role: req.user.role });

    // Default to current week
    let startDate = new Date();
    let endDate = new Date();

    const currentDay = startDate.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    startDate.setDate(startDate.getDate() + mondayOffset);
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    let queryParams = [];

    // Calculate week numbers for the date range
    const semesterStart = new Date("2024-08-26");
    const startWeek = Math.ceil(
      (startDate - semesterStart) / (7 * 24 * 60 * 60 * 1000)
    );
    const endWeek = Math.ceil(
      (endDate - semesterStart) / (7 * 24 * 60 * 60 * 1000)
    );

    // First get rescheduled events for the date range
    let rescheduledQuery = `
      SELECT se.id, EXTRACT(DOW FROM se.event_date) as day_of_week, 
             se.start_time, se.end_time,
             c.id as course_id, c.course_code, c.course_name,
             'Dosen' as lecturer_name,
             cl.id as room_id, cl.room_number as room_name, cl.capacity,
             b.building_name as building,
             se.event_date, 'rescheduled' as event_type, se.week_number
      FROM schedule_events se
      JOIN courses c ON se.course_id = c.id
      LEFT JOIN classrooms cl ON se.room_id = cl.id
      LEFT JOIN buildings b ON cl.building_id = b.id
      WHERE se.status NOT IN ('cancelled', 'replaced')
      AND se.event_date BETWEEN $${queryParams.length + 1} AND $${
      queryParams.length + 2
    }
    `;
    queryParams.push(
      `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(startDate.getDate()).padStart(2, "0")}`,
      `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(endDate.getDate()).padStart(2, "0")}`
    );

    if (req.user.role !== "admin") {
      rescheduledQuery += ` AND EXISTS (
        SELECT 1 FROM course_subscriptions csub 
        WHERE csub.user_id = $${
          queryParams.length + 1
        } AND csub.course_id = se.course_id
      )`;
      queryParams.push(user_id);
    }

    const rescheduledResult = await pool.query(rescheduledQuery, queryParams);

    // Get courses that have been rescheduled for specific weeks
    const rescheduledCourseWeeks = new Set();
    rescheduledResult.rows.forEach((event) => {
      rescheduledCourseWeeks.add(`${event.course_id}-${event.week_number}`);
    });

    // Now get default schedules, excluding those that have been rescheduled
    queryParams = [];
    let defaultQuery = `
      SELECT cs.id, cs.day_of_week, cs.start_time, cs.end_time,
             c.id as course_id, c.course_code, c.course_name,
             cs.lecturer_name,
             cl.id as room_id, cl.room_number as room_name, cl.capacity,
             b.building_name as building,
             NULL as event_date, 'default' as event_type
      FROM class_schedules cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN classrooms cl ON cs.room_id = cl.id
      LEFT JOIN buildings b ON cl.building_id = b.id
      WHERE 1=1
    `;

    if (req.user.role !== "admin") {
      defaultQuery += ` AND EXISTS (
        SELECT 1 FROM course_subscriptions csub 
        WHERE csub.user_id = $${
          queryParams.length + 1
        } AND csub.course_id = c.id
      )`;
      queryParams.push(user_id);
    }

    const defaultResult = await pool.query(defaultQuery, queryParams);

    console.log(
      "📊 Found rescheduled courses:",
      rescheduledResult.rows.map((r) => `${r.course_name} on ${r.event_date}`)
    );
    console.log(
      "📊 Found default courses:",
      defaultResult.rows.map((r) => r.course_name)
    );
    console.log(
      "📅 Date range being queried:",
      startDate.toISOString().split("T")[0],
      "to",
      endDate.toISOString().split("T")[0]
    );

    // Combine results, prioritizing rescheduled events
    const allEvents = [...rescheduledResult.rows];

    // Get courses that have ANY rescheduled events in the date range
    const rescheduledCourses = new Set(
      rescheduledResult.rows.map((event) => event.course_id)
    );

    // Add default schedules only for courses that have NO rescheduled events
    defaultResult.rows.forEach((defaultEvent) => {
      if (!rescheduledCourses.has(defaultEvent.course_id)) {
        for (let week = startWeek; week <= endWeek; week++) {
          allEvents.push({ ...defaultEvent, week_number: week });
        }
      }
    });

    // Group events by date and remove duplicates
    const eventsByDate = {};
    const seenCoursesByDate = {};

    allEvents.forEach((event) => {
      let eventDate;

      if (event.event_date) {
        // Rescheduled event - handle string or Date object
        if (typeof event.event_date === "string") {
          const [y, m, d] = event.event_date.split("-").map(Number);
          eventDate = new Date(y, m - 1, d);
        } else if (event.event_date instanceof Date) {
          eventDate = new Date(
            event.event_date.getFullYear(),
            event.event_date.getMonth(),
            event.event_date.getDate()
          );
        } else {
          // Fallback: attempt to construct date directly
          eventDate = new Date(event.event_date);
        }
      } else {
        // Default event - calculate date based on day of week and week number
        const monday = new Date(startDate);
        eventDate = new Date(monday);
        eventDate.setDate(monday.getDate() + (event.day_of_week - 1));
      }

      const dateStr = `${eventDate.getFullYear()}-${String(
        eventDate.getMonth() + 1
      ).padStart(2, "0")}-${String(eventDate.getDate()).padStart(2, "0")}`;

      // Check if this course already exists for this date
      if (!seenCoursesByDate[dateStr]) {
        seenCoursesByDate[dateStr] = new Set();
      }

      if (seenCoursesByDate[dateStr].has(event.course_id)) {
        return; // Skip duplicate
      }

      seenCoursesByDate[dateStr].add(event.course_id);

      if (!eventsByDate[dateStr]) {
        eventsByDate[dateStr] = [];
      }

      eventsByDate[dateStr].push({
        id: event.id,
        course_id: event.course_id,
        course_code: event.course_code,
        course_name: event.course_name,
        lecturer_name: event.lecturer_name,
        room: {
          id: event.room_id,
          name: event.room_name,
          capacity: event.capacity,
          building: event.building,
        },
        time: `${event.start_time} - ${event.end_time}`,
        start_time: event.start_time,
        end_time: event.end_time,
        event_date: dateStr,
        event_type: event.event_type,
      });
    });

    const totalEvents = Object.values(eventsByDate).reduce(
      (sum, events) => sum + events.length,
      0
    );
    console.log(
      "📊 Final unique courses by date:",
      Object.keys(eventsByDate).map(
        (date) =>
          `${date}: [${eventsByDate[date]
            .map((e) => e.course_name)
            .join(", ")}]`
      )
    );
    console.log("📦 Full events data:", JSON.stringify(eventsByDate, null, 2));

    res.json({
      events: eventsByDate,
      date_range: {
        start_date: `${startDate.getFullYear()}-${String(
          startDate.getMonth() + 1
        ).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`,
        end_date: `${endDate.getFullYear()}-${String(
          endDate.getMonth() + 1
        ).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`,
      },
      total_events: totalEvents,
    });
  } catch (error) {
    console.error("Schedule error:", error);
    res.status(500).json({
      error: "Failed to get schedule",
      details: error.message,
    });
  }
});

// Default schedule (fallback used by client)
router.get("/default", authenticate, async (req, res) => {
  try {
    const user_id = req.user.id;
    let query = `
      SELECT c.id, c.course_code, c.course_name as name, cs.day_of_week, cs.start_time, cs.end_time,
             cs.lecturer_name, cl.room_number as room_name, cl.capacity,
             b.building_name as building
      FROM class_schedules cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN classrooms cl ON cs.room_id = cl.id
      LEFT JOIN buildings b ON cl.building_id = b.id
      WHERE 1=1
    `;

    const queryParams = [];
    if (req.user.role !== "admin") {
      query += ` AND EXISTS (SELECT 1 FROM course_subscriptions csub WHERE csub.user_id = $1 AND csub.course_id = cs.course_id)`;
      queryParams.push(user_id);
    }

    query += ` ORDER BY cs.day_of_week, cs.start_time`;

    const result = await pool.query(query, queryParams);

    const dayNames = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const schedule = result.rows.map((course) => ({
      ...course,
      default_day: course.day_of_week,
      default_start_time: course.start_time,
      default_end_time: course.end_time,
      day_name: dayNames[course.day_of_week - 1] || "Unknown",
    }));

    res.json({ schedule, total: schedule.length });
  } catch (error) {
    console.error("Get default schedule error:", error);
    res
      .status(500)
      .json({
        error: "Failed to get default schedule",
        details: error.message,
      });
  }
});

// Weekly-specific reschedule endpoint
router.post(
  "/update",
  authenticate,
  requireAdminOrKomting,
  async (req, res) => {
    try {
      const {
        courseId,
        newDate,
        newStartTime,
        newEndTime,
        newRoomId,
        weekNumber,
        meetingNumber,
      } = req.body;

      if (!courseId || !newDate || !newStartTime || !newEndTime) {
        return res.status(400).json({
          error: "Missing required fields",
        });
      }

      console.log("🔄 Reschedule request:", {
        courseId,
        newDate,
        newStartTime,
        newEndTime,
        newRoomId,
        weekNumber,
      });

      // Calculate week number if not provided - use local date
      const [year, month, day] = newDate.split("-").map(Number);
      const eventDate = new Date(year, month - 1, day); // Local date
      const semesterStart = new Date(2024, 7, 26); // Local date (August = month 7)
      const calculatedWeek = Math.ceil(
        (eventDate - semesterStart) / (7 * 24 * 60 * 60 * 1000)
      );
      const finalWeekNumber = weekNumber || calculatedWeek;

      // Use transaction to ensure data consistency
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Create schedule_events table if it doesn't exist
        await client.query(`
        CREATE TABLE IF NOT EXISTS schedule_events (
          id SERIAL PRIMARY KEY,
          course_id INTEGER NOT NULL,
          room_id INTEGER,
          event_date DATE NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          status VARCHAR(50) DEFAULT 'rescheduled',
          changed_by INTEGER,
          week_number INTEGER,
          meeting_number INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

        // Add missing columns if they don't exist
        try {
          await client.query(
            "ALTER TABLE schedule_events ADD COLUMN IF NOT EXISTS week_number INTEGER"
          );
          await client.query(
            "ALTER TABLE schedule_events ADD COLUMN IF NOT EXISTS meeting_number INTEGER"
          );
        } catch (e) {
          // Columns might already exist
        }

        // Check for time conflicts (regardless of room)
        const timeConflictCheck = await client.query(
          `
        SELECT c.course_name, cl.room_number FROM schedule_events se
        JOIN courses c ON se.course_id = c.id
        LEFT JOIN classrooms cl ON se.room_id = cl.id
        WHERE se.event_date = $1
        AND se.status NOT IN ('cancelled', 'replaced')
        AND se.start_time < $3 AND se.end_time > $2
        AND se.course_id != $4
      `,
          [newDate, newStartTime, newEndTime, courseId]
        );

        if (timeConflictCheck.rows.length > 0) {
          await client.query("ROLLBACK");
          return res.status(409).json({
            error: "Time conflict",
            details: `Time slot conflicts with ${
              timeConflictCheck.rows[0].course_name
            } in room ${timeConflictCheck.rows[0].room_number || "TBA"}`,
          });
        }

        // Check for room conflicts if room is specified
        if (newRoomId) {
          const roomConflictCheck = await client.query(
            `
          SELECT c.course_name FROM schedule_events se
          JOIN courses c ON se.course_id = c.id
          WHERE se.room_id = $1 AND se.event_date = $2
          AND se.status NOT IN ('cancelled', 'replaced')
          AND se.start_time < $4 AND se.end_time > $3
          AND se.course_id != $5
        `,
            [newRoomId, newDate, newStartTime, newEndTime, courseId]
          );

          if (roomConflictCheck.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({
              error: "Room conflict",
              details: `Room is already booked by ${roomConflictCheck.rows[0].course_name}`,
            });
          }
        }

        // Delete existing events for this course and week (instead of marking as replaced)
        const deleteResult = await client.query(
          `
        DELETE FROM schedule_events 
        WHERE course_id = $1 AND week_number = $2 AND status NOT IN ('cancelled')
        RETURNING id
      `,
          [courseId, finalWeekNumber]
        );

        console.log(
          `🗑️ Deleted ${deleteResult.rows.length} existing events for course ${courseId}, week ${finalWeekNumber}`
        );

        // Insert new reschedule record for this specific week
        const result = await client.query(
          `
        INSERT INTO schedule_events 
        (course_id, room_id, event_date, start_time, end_time, status, changed_by, week_number, meeting_number)
        VALUES ($1, $2, $3::date, $4, $5, 'rescheduled', $6, $7, $8)
        RETURNING *
      `,
          [
            courseId,
            newRoomId,
            newDate,
            newStartTime,
            newEndTime,
            req.user.id,
            finalWeekNumber,
            meetingNumber,
          ]
        );

        await client.query("COMMIT");
        console.log("✅ Reschedule successful for week", finalWeekNumber);

        res.json({
          message: `Schedule updated successfully for week ${finalWeekNumber}`,
          event: result.rows[0],
          week_number: finalWeekNumber,
        });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Update schedule error:", error);
      res.status(500).json({
        error: "Failed to update schedule",
        details: error.message,
      });
    }
  }
);

export default router;
