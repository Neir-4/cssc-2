import express from 'express';
import pool from '../config/database.js';
import { 
  authenticate, 
  requireKomting, 
  requireAdminOrKomting,
  validate,
  scheduleSchemas,
  validateTimeRange,
  validateFutureDate,
  logActivity
} from '../middleware/index.js';

const router = express.Router();

// Get available time slots for a specific date
router.get('/available-slots/:date', authenticate, async (req, res) => {
  try {
    const { date } = req.params;
    const { duration_minutes = 150 } = req.query;
    
    // Validate date
    if (isNaN(Date.parse(date))) {
      return res.status(400).json({
        error: 'Invalid date format',
        details: 'Date must be in YYYY-MM-DD format'
      });
    }

    const duration = parseInt(duration_minutes);
    
    // Generate time slots from 7:00 to 18:00
    const timeSlots = [];
    for (let hour = 7; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startHour = hour;
        const startMinute = minute;
        const endTotalMinutes = startHour * 60 + startMinute + duration;
        const endHour = Math.floor(endTotalMinutes / 60);
        const endMin = endTotalMinutes % 60;
        
        if (endHour <= 18) {
          const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
          const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
          
          // Check room availability for this time slot
          const availableRooms = await pool.query(`
            SELECT r.id, r.name, r.capacity, r.floor, r.building
            FROM rooms r
            WHERE r.is_active = true
            AND r.id NOT IN (
              SELECT se.room_id
              FROM schedule_events se
              WHERE se.event_date = $1
              AND se.status NOT IN ('cancelled', 'replaced')
              AND se.start_time < $3 AND se.end_time > $2
            )
            ORDER BY r.name
          `, [date, startTime, endTime]);
          
          timeSlots.push({
            start_time: startTime,
            end_time: endTime,
            available_rooms: availableRooms.rows,
            room_count: availableRooms.rows.length
          });
        }
      }
    }

    res.json({
      date,
      duration_minutes: duration,
      time_slots: timeSlots,
      total_slots: timeSlots.length
    });

  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      error: 'Failed to get available slots',
      details: error.message
    });
  }
});

// Create schedule event with proper week tracking
router.post('/create-event', 
  authenticate,
  requireAdminOrKomting,
  validateTimeRange,
  validateFutureDate,
  logActivity('SCHEDULE_CREATE'),
  async (req, res) => {
  try {
    const { course_id, room_id, event_date, start_time, end_time, notes } = req.body;
    
    // Check room availability
    const conflictCheck = await pool.query(`
      SELECT se.id, c.course_code, c.name as course_name
      FROM schedule_events se
      JOIN courses c ON se.course_id = c.id
      WHERE se.room_id = $1 
      AND se.event_date = $2
      AND se.status NOT IN ('cancelled', 'replaced')
      AND se.start_time < $4 AND se.end_time > $3
    `, [room_id, event_date, start_time, end_time]);
    
    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({
        error: 'Room conflict',
        details: `Room is already booked by ${conflictCheck.rows[0].course_code} - ${conflictCheck.rows[0].course_name}`,
        conflicting_event: conflictCheck.rows[0]
      });
    }
    
    // Calculate academic week and meeting number
    const academicWeek = await pool.query(
      'SELECT get_academic_week($1::date) as week_number',
      [event_date]
    );
    
    // Get next meeting number for this course
    const meetingResult = await pool.query(`
      SELECT COALESCE(MAX(meeting_number), 0) + 1 as next_meeting
      FROM schedule_events 
      WHERE course_id = $1 AND status NOT IN ('cancelled', 'replaced')
    `, [course_id]);
    
    const meetingNumber = meetingResult.rows[0].next_meeting;
    const weekNumber = academicWeek.rows[0].week_number;
    
    // Create the event
    const result = await pool.query(`
      INSERT INTO schedule_events 
      (course_id, room_id, event_date, start_time, end_time, status, changed_by, 
       change_reason, meeting_number, academic_week)
      VALUES ($1, $2, $3, $4, $5, 'scheduled', $6, $7, $8, $9)
      RETURNING *
    `, [course_id, room_id, event_date, start_time, end_time, req.user.id, 
        notes || 'New schedule created', meetingNumber, weekNumber]);
    
    // Get complete event details
    const eventDetails = await pool.query(`
      SELECT se.*, c.course_code, c.name as course_name, r.name as room_name,
             u.name as created_by_name
      FROM schedule_events se
      JOIN courses c ON se.course_id = c.id
      JOIN rooms r ON se.room_id = r.id
      JOIN users u ON se.changed_by = u.id
      WHERE se.id = $1
    `, [result.rows[0].id]);
    
    res.status(201).json({
      message: 'Schedule event created successfully',
      event: eventDetails.rows[0]
    });

  } catch (error) {
    console.error('Create schedule event error:', error);
    res.status(500).json({
      error: 'Failed to create schedule event',
      details: error.message
    });
  }
});

// Update specific week's schedule (not all weeks)
router.put('/update-week/:course_id/:week_number',
  authenticate,
  requireAdminOrKomting,
  validateTimeRange,
  logActivity('SCHEDULE_UPDATE_WEEK'),
  async (req, res) => {
  try {
    const { course_id, week_number } = req.params;
    const { room_id, event_date, start_time, end_time, notes } = req.body;
    
    // Verify course access
    const courseCheck = await pool.query(
      'SELECT komting_id FROM courses WHERE id = $1',
      [course_id]
    );
    
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Course not found'
      });
    }
    
    if (req.user.role !== 'admin' && courseCheck.rows[0].komting_id !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        details: 'You are not the komting for this course'
      });
    }
    
    // Check if there's an existing event for this week
    const existingEvent = await pool.query(`
      SELECT id FROM schedule_events 
      WHERE course_id = $1 AND academic_week = $2 
      AND status NOT IN ('cancelled', 'replaced')
    `, [course_id, week_number]);
    
    if (existingEvent.rows.length > 0) {
      // Mark existing event as replaced
      await pool.query(
        'UPDATE schedule_events SET status = $1 WHERE id = $2',
        ['replaced', existingEvent.rows[0].id]
      );
    }
    
    // Check room availability for new time
    const conflictCheck = await pool.query(`
      SELECT se.id, c.course_code
      FROM schedule_events se
      JOIN courses c ON se.course_id = c.id
      WHERE se.room_id = $1 AND se.event_date = $2
      AND se.status NOT IN ('cancelled', 'replaced')
      AND se.start_time < $4 AND se.end_time > $3
      AND se.course_id != $5
    `, [room_id, event_date, start_time, end_time, course_id]);
    
    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({
        error: 'Room conflict',
        details: `Room is already booked by ${conflictCheck.rows[0].course_code}`
      });
    }
    
    // Create new event for this specific week
    const result = await pool.query(`
      INSERT INTO schedule_events 
      (course_id, room_id, event_date, start_time, end_time, status, changed_by, 
       change_reason, academic_week, previous_event_id)
      VALUES ($1, $2, $3, $4, $5, 'changed', $6, $7, $8, $9)
      RETURNING *
    `, [course_id, room_id, event_date, start_time, end_time, req.user.id,
        notes || `Week ${week_number} schedule updated`, week_number,
        existingEvent.rows[0]?.id || null]);
    
    res.json({
      message: `Week ${week_number} schedule updated successfully`,
      event: result.rows[0]
    });

  } catch (error) {
    console.error('Update week schedule error:', error);
    res.status(500).json({
      error: 'Failed to update week schedule',
      details: error.message
    });
  }
});

// Get schedule by week
router.get('/week/:course_id/:week_number', authenticate, async (req, res) => {
  try {
    const { course_id, week_number } = req.params;
    
    const result = await pool.query(`
      SELECT se.*, c.course_code, c.name as course_name, r.name as room_name,
             u.name as changed_by_name
      FROM schedule_events se
      JOIN courses c ON se.course_id = c.id
      JOIN rooms r ON se.room_id = r.id
      LEFT JOIN users u ON se.changed_by = u.id
      WHERE se.course_id = $1 AND se.academic_week = $2
      AND se.status NOT IN ('cancelled', 'replaced')
      ORDER BY se.event_date, se.start_time
    `, [course_id, week_number]);
    
    res.json({
      course_id: parseInt(course_id),
      week_number: parseInt(week_number),
      events: result.rows
    });

  } catch (error) {
    console.error('Get week schedule error:', error);
    res.status(500).json({
      error: 'Failed to get week schedule',
      details: error.message
    });
  }
});

export default router;