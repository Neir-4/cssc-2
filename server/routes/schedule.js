import express from 'express';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      error: 'No token provided',
      details: 'Authorization token is required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        error: 'Invalid token',
        details: 'Token is invalid or expired'
      });
    }
    req.user = decoded;
    next();
  });
};

// Validation schemas
const updateScheduleSchema = Joi.object({
  eventId: Joi.number().integer().optional(),
  courseId: Joi.number().integer().required(),
  newDate: Joi.date().iso().required(),
  newStartTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  newEndTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  newRoomId: Joi.number().integer().optional().allow(null),
  newRoomName: Joi.string().optional()
});

// Get default schedule for a user
router.get('/default', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;

    let query = `
      SELECT c.id, c.course_code, c.name, c.default_day, c.default_start_time, c.default_end_time,
             l.name as lecturer_name, k.name as komting_name, r.name as room_name, r.capacity,
             r.floor, r.building
      FROM courses c
      LEFT JOIN users l ON c.lecturer_id = l.id
      LEFT JOIN users k ON c.komting_id = k.id
      LEFT JOIN rooms r ON c.default_room_id = r.id
      WHERE c.is_active = true
    `;
    
    let queryParams = [];

    // Filter based on user role
    if (req.user.role === 'mahasiswa') {
      query += ` AND c.id IN (
        SELECT course_id FROM course_subscriptions WHERE user_id = $1
      )`;
      queryParams.push(user_id);
    } else if (req.user.role === 'dosen') {
      query += ` AND c.lecturer_id = $1`;
      queryParams.push(user_id);
    } else if (req.user.role === 'komting') {
      query += ` AND c.komting_id = $1`;
      queryParams.push(user_id);
    }

    query += ` ORDER BY c.default_day, c.default_start_time`;

    const result = await pool.query(query, queryParams);

    // Map day numbers to Indonesian names
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
    const schedule = result.rows.map(course => ({
      ...course,
      day_name: dayNames[course.default_day - 1] || 'Unknown'
    }));

    res.json({
      schedule,
      total: schedule.length
    });

  } catch (error) {
    console.error('Get default schedule error:', error);
    res.status(500).json({
      error: 'Failed to get default schedule',
      details: error.message
    });
  }
});

// Get real schedule (actual events) for a user
router.get('/real', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { start_date, end_date } = req.query;

    // Default to current week if no date range provided
    let startDate = new Date();
    let endDate = new Date();
    
    if (start_date && end_date) {
      startDate = new Date(start_date);
      endDate = new Date(end_date);
    } else {
      // Get current week (Monday to Sunday)
      const currentDay = startDate.getDay();
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
      startDate.setDate(startDate.getDate() + mondayOffset);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    }

    let query = `
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
      AND se.status != 'cancelled'
    `;
    
    let queryParams = [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]];

    // Filter based on user role
    if (req.user.role === 'mahasiswa') {
      query += ` AND c.id IN (
        SELECT course_id FROM course_subscriptions WHERE user_id = $3
      )`;
      queryParams.push(user_id);
    } else if (req.user.role === 'dosen') {
      query += ` AND c.lecturer_id = $3`;
      queryParams.push(user_id);
    } else if (req.user.role === 'komting') {
      query += ` AND c.komting_id = $3`;
      queryParams.push(user_id);
    }

    query += ` ORDER BY se.event_date, se.start_time`;

    const result = await pool.query(query, queryParams);

    // Group events by date
    const eventsByDate = {};
    result.rows.forEach(event => {
      const date = event.event_date;
      if (!eventsByDate[date]) {
        eventsByDate[date] = [];
      }
      eventsByDate[date].push({
        id: event.id,
        course_id: event.course_id,
        course_code: event.course_code,
        course_name: event.course_name,
        lecturer_name: event.lecturer_name,
        komting_name: event.komting_name,
        room: {
          id: event.room_id,
          name: event.room_name,
          capacity: event.capacity,
          floor: event.floor,
          building: event.building
        },
        time: `${event.start_time} - ${event.end_time}`,
        start_time: event.start_time,
        end_time: event.end_time,
        status: event.status,
        change_reason: event.change_reason,
        changed_by_name: event.changed_by_name,
        created_at: event.event_created_at
      });
    });

    res.json({
      events: eventsByDate,
      date_range: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      },
      total_events: result.rows.length
    });

  } catch (error) {
    console.error('Get real schedule error:', error);
    res.status(500).json({
      error: 'Failed to get real schedule',
      details: error.message
    });
  }
});

// Update schedule (komting only)
router.post('/update', authenticateToken, async (req, res) => {
  try {
    // Only komting can update schedules
    if (req.user.role !== 'komting') {
      return res.status(403).json({
        error: 'Access denied',
        details: 'Only komting can update schedules'
      });
    }

    const { error, value } = updateScheduleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const { eventId, courseId, newDate, newStartTime, newEndTime, newRoomId, newRoomName } = value;
    const komting_id = req.user.id;

    // Check if course exists and user is the komting for this course
    const courseResult = await pool.query(
      'SELECT id, name, komting_id FROM courses WHERE id = $1 AND is_active = true',
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Course not found',
        details: 'Course does not exist or is inactive'
      });
    }

    const course = courseResult.rows[0];

    // Check if user is the komting for this course
    if (course.komting_id !== komting_id) {
      return res.status(403).json({
        error: 'Access denied',
        details: 'You are not the komting for this course'
      });
    }

    // Find the specific schedule event to update
    let targetEvent;
    if (eventId) {
      // Update specific event
      const eventResult = await pool.query(
        'SELECT * FROM schedule_events WHERE id = $1 AND course_id = $2',
        [eventId, courseId]
      );
      
      if (eventResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Schedule event not found',
          details: 'The specific schedule event does not exist'
        });
      }
      
      targetEvent = eventResult.rows[0];
    } else {
      // Find the next event for this course (from today onwards)
      const eventResult = await pool.query(
        `SELECT * FROM schedule_events 
         WHERE course_id = $1 AND event_date >= CURRENT_DATE 
         ORDER BY event_date ASC LIMIT 1`,
        [courseId]
      );
      
      if (eventResult.rows.length === 0) {
        return res.status(404).json({
          error: 'No upcoming events found',
          details: 'No upcoming schedule events found for this course'
        });
      }
      
      targetEvent = eventResult.rows[0];
    }

    // Find available room or use specified room
    let finalRoomId = newRoomId;
    if (!finalRoomId) {
      // Auto-assign available room
      const availableRoomResult = await pool.query(
        `SELECT r.id FROM rooms r
         WHERE r.id NOT IN (
           SELECT se.room_id FROM schedule_events se
           WHERE se.event_date = $1 AND se.status != 'cancelled'
           AND (
             (se.start_time <= $2 AND se.end_time > $2) OR
             (se.start_time < $3 AND se.end_time >= $3) OR
             (se.start_time >= $2 AND se.end_time <= $3)
           )
         )
         LIMIT 1`,
        [newDate, newStartTime, newEndTime]
      );
      
      if (availableRoomResult.rows.length > 0) {
        finalRoomId = availableRoomResult.rows[0].id;
      } else {
        return res.status(400).json({
          error: 'No available rooms',
          details: 'No rooms available for the selected time slot'
        });
      }
    }

    // Mark the old event as replaced
    await pool.query(
      'UPDATE schedule_events SET status = \'replaced\' WHERE id = $1',
      [targetEvent.id]
    );

    // Create new schedule event
    const newEventResult = await pool.query(
      `INSERT INTO schedule_events 
       (course_id, room_id, event_date, start_time, end_time, status, changed_by, previous_event_id)
       VALUES ($1, $2, $3, $4, $5, 'scheduled', $6, $7)
       RETURNING *`,
      [courseId, finalRoomId, newDate, newStartTime, newEndTime, komting_id, targetEvent.id]
    );

    const newEvent = newEventResult.rows[0];

    // Get room details for response
    const roomResult = await pool.query('SELECT name FROM rooms WHERE id = $1', [finalRoomId]);
    const roomName = roomResult.rows[0]?.name || 'Unknown';

    res.json({
      message: 'Schedule updated successfully',
      newEvent: {
        id: newEvent.id,
        course_id: courseId,
        event_date: newEvent.event_date,
        start_time: newEvent.start_time,
        end_time: newEvent.end_time,
        room_name: roomName
      }
    });

  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      error: 'Failed to update schedule',
      details: error.message
    });
  }
});

// Get schedule history for a course (komting only)
router.get('/history/:course_id', authenticateToken, async (req, res) => {
  try {
    const { course_id } = req.params;

    // Only komting can view schedule history
    if (req.user.role !== 'komting') {
      return res.status(403).json({
        error: 'Access denied',
        details: 'Only komting can view schedule history'
      });
    }

    // Check if course exists and user is the komting for this course
    const courseResult = await pool.query(
      'SELECT id, name, komting_id FROM courses WHERE id = $1 AND is_active = true',
      [course_id]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Course not found',
        details: 'Course does not exist or is inactive'
      });
    }

    const course = courseResult.rows[0];

    // Check if user is the komting for this course
    if (course.komting_id !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        details: 'You are not the komting for this course'
      });
    }

    const result = await pool.query(`
      SELECT se.id, se.event_date, se.start_time, se.end_time, se.status, se.change_reason,
             se.created_at as event_created_at,
             r.name as room_name, r.capacity, r.floor, r.building,
             u.name as changed_by_name,
             pe.event_date as previous_event_date, pe.start_time as previous_start_time, 
             pe.end_time as previous_end_time, pr.name as previous_room_name
      FROM schedule_events se
      JOIN rooms r ON se.room_id = r.id
      LEFT JOIN users u ON se.changed_by = u.id
      LEFT JOIN schedule_events pe ON se.previous_event_id = pe.id
      LEFT JOIN rooms pr ON pe.room_id = pr.id
      WHERE se.course_id = $1
      ORDER BY se.created_at DESC
    `, [course_id]);

    res.json({
      course: {
        id: course.id,
        name: course.name
      },
      history: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Get schedule history error:', error);
    res.status(500).json({
      error: 'Failed to get schedule history',
      details: error.message
    });
  }
});

export default router;
